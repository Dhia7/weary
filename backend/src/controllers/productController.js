const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Category = require('../models/Category');
const User = require('../models/User');
const path = require('path');
const { withTimeout, TIMEOUTS, handleTimeoutError } = require('../utils/queryTimeout');
const {
	parseVariantsPayload,
	syncProductVariants,
	attachVariantSummary,
	computeProductStockFromVariants,
	getActiveVariants
} = require('../utils/variantHelpers');
const { isSoldBadge, isMadeToOrderProduct } = require('../utils/productAvailability');

// Ensure associations are loaded
require('../models/associations');

const variantInclude = {
	model: ProductVariant,
	as: 'variants',
	required: false,
	order: [
		['sortOrder', 'ASC'],
		['color', 'ASC'],
		['size', 'ASC']
	]
};

// Helper function to format product data based on user role
const parsePriceField = (value) => {
	if (value == null || value === '') return null;
	const n = parseFloat(value);
	return Number.isFinite(n) ? n : null;
};

const normalizeProductPrices = (productData) => {
	if (productData.price != null) {
		productData.price = parsePriceField(productData.price);
	}
	if (productData.compareAtPrice != null) {
		const compare = parsePriceField(productData.compareAtPrice);
		const price = parsePriceField(productData.price);
		productData.compareAtPrice =
			compare != null && price != null && compare > price ? compare : null;
	}
	if (Array.isArray(productData.variants)) {
		productData.variants = productData.variants.map((variant) => {
			const v = { ...variant };
			if (v.price != null) v.price = parsePriceField(v.price);
			if (v.compareAtPrice != null) {
				const compare = parsePriceField(v.compareAtPrice);
				const variantPrice = parsePriceField(v.price) ?? parsePriceField(productData.price);
				v.compareAtPrice =
					compare != null && variantPrice != null && compare > variantPrice
						? compare
						: null;
			}
			return v;
		});
	}
	return productData;
};

const formatProductForUser = (product, isAdmin = false) => {
	const productData = normalizeProductPrices(product.toJSON ? product.toJSON() : product);
	
	// Ensure imageUrl is set from images array if missing
	if (!productData.imageUrl && Array.isArray(productData.images) && productData.images.length > 0) {
		const mainIndex = productData.mainThumbnailIndex || 0;
		productData.imageUrl = productData.images[mainIndex] || productData.images[0];
	}
	
	// Ensure images is always an array
	if (!Array.isArray(productData.images)) {
		productData.images = productData.imageUrl ? [productData.imageUrl] : [];
	}
	
	// Calculate size-specific stock info
	// For made-to-order products with sizes, all sizes are always available
	const sizeStock = productData.sizeStock || {};
	const sizeStockInfo = {};
	
	const variants = productData.variants || [];
	const hasVariants = getActiveVariants(variants).length > 0;
	const madeToOrder = isMadeToOrderProduct({ ...productData, hasVariants });

	if (productData.size && typeof sizeStock === 'object' && madeToOrder) {
		const sizes = productData.size.split(',').map(s => s.trim());
		sizes.forEach(size => {
			sizeStockInfo[size] = {
				quantity: 999,
				status: 'Available',
				isInStock: true,
				isLowStock: false
			};
		});
	}

	// Calculate overall stock status
	let overallQuantity = productData.quantity;
	let overallIsInStock = productData.quantity > 0;
	let overallIsLowStock = productData.quantity > 0 && productData.quantity <= 10;

	if (isSoldBadge(productData)) {
		overallIsInStock = false;
		overallIsLowStock = false;
	} else if (madeToOrder) {
		overallIsInStock = true;
		overallIsLowStock = productData.quantity > 0 && productData.quantity <= 10;
		overallQuantity = productData.quantity;
	}

	let formatted;
	if (isAdmin) {
		formatted = {
			...productData,
			stockInfo: {
				quantity: overallQuantity,
				status: overallQuantity > 10 ? 'In Stock' : 
				        overallQuantity > 0 ? 'Low Stock' : 'Out of Stock',
				isInStock: overallIsInStock,
				isLowStock: overallIsLowStock
			},
			sizeStock: sizeStock,
			sizeStockInfo: sizeStockInfo
		};
	} else {
		formatted = {
			...productData,
			stockInfo: {
				status: overallQuantity > 10 ? 'In Stock' : 
				        overallQuantity > 0 ? 'Low Stock' : 'Out of Stock',
				isInStock: overallIsInStock,
				isLowStock: overallIsLowStock
			},
			sizeStockInfo: sizeStockInfo
		};
	}

	if (hasVariants) {
		const withVariants = attachVariantSummary(formatted, variants, isAdmin);
		if (isSoldBadge(productData)) {
			withVariants.stockInfo = {
				...(withVariants.stockInfo || {}),
				isInStock: false,
				isLowStock: false,
				status: 'Out of Stock',
				...(isAdmin ? { quantity: overallQuantity } : {})
			};
			if (Array.isArray(withVariants.variants)) {
				withVariants.variants = withVariants.variants.map((v) => ({
					...v,
					stockInfo: {
						...(v.stockInfo || {}),
						isInStock: false,
						isLowStock: false,
						status: 'Out of Stock',
						...(isAdmin ? { quantity: v.quantity } : {})
					}
				}));
			}
		}
		return withVariants;
	}

	return formatted;
};

const validateVariantSkus = async (variantsPayload, excludeProductId = null) => {
	const incoming = parseVariantsPayload(variantsPayload);
	const skus = incoming.map((v) => v.SKU).filter(Boolean);
	if (skus.length !== new Set(skus).size) {
		return 'Duplicate SKU within variants';
	}
	for (const row of incoming) {
		if (!row.color || !String(row.color).trim()) {
			return 'Each variant must have a color';
		}
	}
	if (skus.length === 0 && incoming.length > 0) {
		return null;
	}
	for (const sku of skus) {
		const where = { SKU: sku };
		const existing = await ProductVariant.findOne({ where });
		if (existing && (!excludeProductId || existing.productId !== parseInt(excludeProductId, 10))) {
			return `Variant SKU already exists: ${sku}`;
		}
	}
	return null;
};

const parseOptionalDecimal = (value) => {
	if (value === undefined || value === null || value === '') return null;
	const parsed = parseFloat(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const parseSpecFields = (body) => ({
	depthCm: parseOptionalDecimal(body.depthCm),
	widthCm: parseOptionalDecimal(body.widthCm),
	heightCm: parseOptionalDecimal(body.heightCm),
	outerMaterial: body.outerMaterial?.trim() || null
});

const parseBooleanField = (value, defaultValue = false) => {
	if (value === undefined || value === null || value === '') return defaultValue;
	if (typeof value === 'boolean') return value;
	return value === 'true' || value === '1' || value === 1;
};

const parseDisplayBadge = (value) => {
	if (value === undefined) return undefined;
	if (value === null || value === '' || value === 'none') return null;
	if (value === 'new_arrival' || value === 'sold') return value;
	return null;
};

// Create product (admin)
const createProduct = async (req, res) => {
	try {
		const { name, slug, description, SKU, weightGrams, isActive, displayBadge, categoryIds, price, compareAtPrice, quantity, barcode, size, allowCustomerQuantity } = req.body;
		const specs = parseSpecFields(req.body);
		
		// Parse categoryIds if it's a string (from FormData)
		let parsedCategoryIds = categoryIds;
		console.log('Received categoryIds:', categoryIds, 'Type:', typeof categoryIds);
		if (typeof categoryIds === 'string') {
			try {
				parsedCategoryIds = JSON.parse(categoryIds);
			} catch (e) {
				console.error('Failed to parse categoryIds:', e);
				parsedCategoryIds = [];
			}
		}
		// Ensure parsedCategoryIds is always an array (default to empty array if undefined)
		if (!Array.isArray(parsedCategoryIds)) {
			parsedCategoryIds = [];
		}
		console.log('Parsed categoryIds:', parsedCategoryIds);

		const existing = await Product.findOne({ 
			where: { [Op.or]: [{ slug }, { SKU }, ...(barcode ? [{ barcode }] : [])] },
			attributes: { exclude: ['sizeStock'] }
		});
		if (existing) {
			return res.status(400).json({ success: false, message: 'Product with slug, SKU, or barcode already exists' });
		}

		// Handle multiple image uploads
		let imageUrls = [];
		if (req.cloudinaryUrls && req.cloudinaryUrls.length > 0) {
			// Use Cloudinary URLs if available
			imageUrls = req.cloudinaryUrls;
		} else if (req.files && req.files.length > 0) {
			// Fallback to local storage
			const sortedFiles = req.files.sort((a, b) => {
				const aIndex = parseInt(a.fieldname.replace('image_', ''));
				const bIndex = parseInt(b.fieldname.replace('image_', ''));
				return aIndex - bIndex;
			});
			imageUrls = sortedFiles.map(file => `/uploads/${file.filename}`);
		}

		// Get main thumbnail index from request body
		const mainThumbnailIndex = parseInt(req.body.mainThumbnailIndex) || 0;

		// Note: sizeStock column doesn't exist in database, so we don't include it in create
		const product = await Product.create({ 
			name, 
			slug, 
			description, 
			SKU, 
			weightGrams: weightGrams ? parseInt(weightGrams) : null, 
			isActive: isActive === 'true' || isActive === true,
			displayBadge: parseDisplayBadge(displayBadge) ?? null,
			allowCustomerQuantity: parseBooleanField(allowCustomerQuantity, false),
			imageUrl: imageUrls.length > 0 ? imageUrls[mainThumbnailIndex] || imageUrls[0] : null, // Use selected thumbnail as main image
			images: imageUrls, // Store all images
			mainThumbnailIndex: mainThumbnailIndex, // Store the selected thumbnail index
			price: parseFloat(price),
			compareAtPrice: (() => {
				if (!compareAtPrice) return null;
				const compare = parseFloat(compareAtPrice);
				const basePrice = parseFloat(price);
				return Number.isFinite(compare) && Number.isFinite(basePrice) && compare > basePrice
					? compare
					: null;
			})(),
			quantity: parseInt(quantity) || 0,
			barcode: barcode || null,
			size: size || null,
			...specs
		});

		if (Array.isArray(parsedCategoryIds) && parsedCategoryIds.length) {
			const categories = await Category.findAll({ where: { id: parsedCategoryIds } });
			await product.setCategories(categories);
		}

		const variantsPayload = req.body.variants;
		if (variantsPayload) {
			const skuError = await validateVariantSkus(variantsPayload);
			if (skuError) {
				await product.destroy();
				return res.status(400).json({ success: false, message: skuError });
			}
			const savedVariants = await syncProductVariants(product.id, variantsPayload, SKU);
			if (savedVariants.length > 0) {
				product.quantity = computeProductStockFromVariants(savedVariants);
				await product.save();
			}
		}

		const created = await Product.findByPk(product.id, { 
			include: [{ model: Category, as: 'categories' }, variantInclude],
			attributes: { exclude: ['sizeStock'] }
		});
		const formatted = formatProductForUser(created, true);
		res.status(201).json({ success: true, data: { product: formatted } });
	} catch (error) {
		console.error('Create product error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// List products with pagination and filters
	const listProducts = async (req, res) => {
	try {
		console.log('📦 List products request:', { query: req.query });
		const page = parseInt(req.query.page) || 1;
		const limit = Math.min(parseInt(req.query.limit) || 12, 100); // Max 100 items per page
		const offset = (page - 1) * limit;
		const { q, active, categoryId, sort, order } = req.query;

		const where = {};
		if (q) {
			const searchTerm = q.trim();
			
			// Only proceed if we have a valid search term
			if (searchTerm.length > 0) {
				// Use a simpler, more reliable approach:
				// Combine full-text search (if index exists) with ILIKE fallbacks
				// This ensures the query works even if the full-text index hasn't been created yet
				const escapedTerm = searchTerm.replace(/'/g, "''").replace(/[\\]/g, '\\\\');
				
				where[Op.or] = [
					// Full-text search on name and description (uses GIN index if available)
					// Using COALESCE to handle null values safely
					sequelize.literal(`to_tsvector('english', COALESCE("name", '') || ' ' || COALESCE("description", '')) @@ plainto_tsquery('english', '${escapedTerm}')`),
					// Fallback ILIKE searches for partial matches and SKU
					{ name: { [Op.iLike]: `%${searchTerm}%` } },
					{ description: { [Op.iLike]: `%${searchTerm}%` } },
					{ SKU: { [Op.iLike]: `%${searchTerm}%` } }
				];
			}
		}
		if (active !== undefined) {
			where.isActive = String(active) === 'true';
		}

		const include = [{ model: Category, as: 'categories', through: { attributes: [] } }];
		if (categoryId) {
			include[0].where = { id: categoryId };
		}

		// Handle sorting
		let orderClause = [['createdAt', 'DESC']]; // Default sort
		if (sort && order) {
			const validSortFields = ['name', 'price', 'createdAt', 'updatedAt'];
			const validOrders = ['ASC', 'DESC'];
			
			if (validSortFields.includes(sort) && validOrders.includes(order.toUpperCase())) {
				orderClause = [[sort, order.toUpperCase()]];
			}
		}

		// Execute query - always exclude sizeStock since column doesn't exist and we use made-to-order
		let count, rows;
		try {
			// Query without sizeStock (made-to-order products don't need stock tracking)
			const result = await withTimeout(
				Product.findAndCountAll({
					where,
					include: [...include, variantInclude],
					order: orderClause,
					limit,
					offset,
					distinct: true,
					attributes: {
						exclude: ['sizeStock'] // Always exclude sizeStock - column doesn't exist and not needed for made-to-order
					}
				}),
				TIMEOUTS.COMPLEX_QUERY,
				'Product listing query'
			);
			count = result.count;
			rows = result.rows;
			// Add empty sizeStock to each product for backward compatibility
			rows = rows.map(product => {
				const productData = product.toJSON ? product.toJSON() : product;
				if (!productData.sizeStock) {
					productData.sizeStock = {};
				}
				if (product.toJSON) {
					product.sizeStock = {};
					return product;
				}
				return productData;
			});
		} catch (error) {
			if (q && error.message && (
				error.message.includes('tsvector') || 
				error.message.includes('tsquery') || 
				error.message.includes('full-text') ||
				error.message.includes('function') ||
				error.name === 'SequelizeDatabaseError'
			)) {
				console.warn('Full-text search failed, falling back to ILIKE:', error.message);
				const searchTerm = q.trim();
				// Create a new where clause without full-text search
				const fallbackWhere = {};
				if (active !== undefined) {
					fallbackWhere.isActive = String(active) === 'true';
				}
				fallbackWhere[Op.or] = [
					{ name: { [Op.iLike]: `%${searchTerm}%` } },
					{ description: { [Op.iLike]: `%${searchTerm}%` } },
					{ SKU: { [Op.iLike]: `%${searchTerm}%` } }
				];
				
				const result = await withTimeout(
					Product.findAndCountAll({
						where: fallbackWhere,
						include,
						order: orderClause,
						limit,
						offset,
						distinct: true
					}),
					TIMEOUTS.COMPLEX_QUERY,
					'Product listing query (fallback)'
				);
				count = result.count;
				rows = result.rows;
			} else {
				// Re-throw if it's a different error
				throw error;
			}
		}

		// Check if user is admin (from auth middleware)
		let isAdmin = false;
		if (req.user && req.user.userId) {
			try {
				const user = await User.findByPk(req.user.userId, {
					attributes: ['isAdmin']
				});
				isAdmin = user && user.isAdmin === true;
			} catch (error) {
				console.error('Error checking admin status:', error);
			}
		}
		
		// Format products based on user role
		const formattedProducts = rows.map(product => formatProductForUser(product, isAdmin));

		const totalPages = Math.ceil(count / limit);
		console.log('✅ Products found:', count, 'Formatted:', formattedProducts.length);
		res.json({ success: true, data: { products: formattedProducts, pagination: { currentPage: page, totalPages, totalProducts: count, perPage: limit } } });
	} catch (error) {
		console.error('❌ List products error:', error);
		console.error('Error details:', {
			name: error.name,
			message: error.message,
			stack: error.stack?.split('\n').slice(0, 5).join('\n')
		});
		return handleTimeoutError(error, res, 'List products');
	}
};

// Get single product by slug or id
const getProduct = async (req, res) => {
	try {
		const { idOrSlug } = req.params;
		const where = /^(\d+)$/.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
		// Always exclude sizeStock since column doesn't exist and we use made-to-order
		const product = await Product.findOne({ 
			where, 
			include: [
				{ model: Category, as: 'categories', through: { attributes: [] } },
				variantInclude
			],
			attributes: { exclude: ['sizeStock'] }
		});
		
		if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
		
		// Ensure product is a Sequelize instance or plain object
		const productData = product.toJSON ? product.toJSON() : product;
		// Add empty sizeStock for backward compatibility (not used for made-to-order)
		if (!productData.sizeStock) {
			productData.sizeStock = {};
		}
		
		// Check if user is admin (from auth middleware)
		let isAdmin = false;
		if (req.user && req.user.userId) {
			try {
				const user = await User.findByPk(req.user.userId, {
					attributes: ['isAdmin']
				});
				isAdmin = user && user.isAdmin === true;
			} catch (error) {
				console.error('Error checking admin status:', error);
			}
		}
		
		// Format product based on user role (pass productData instead of product instance)
		const formattedProduct = formatProductForUser(productData, isAdmin);
		
		res.json({ success: true, data: { product: formattedProduct } });
	} catch (error) {
		console.error('Get product error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Update product (admin)
const updateProduct = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, slug, description, SKU, weightGrams, isActive, displayBadge, categoryIds, price, compareAtPrice, quantity, barcode, size, sizeStock, depthCm, widthCm, heightCm, outerMaterial, allowCustomerQuantity } = req.body;
		
		console.log('=== UPDATE PRODUCT REQUEST ===');
		console.log('Product ID:', id);
		console.log('Received sizeStock:', sizeStock, 'Type:', typeof sizeStock);
		console.log('Received size:', size);
		console.log('Received quantity:', quantity);
		console.log('All body keys:', Object.keys(req.body));
		
		// Always exclude sizeStock since column doesn't exist and we use made-to-order
		const product = await Product.findByPk(id, { 
			include: [{ model: Category, as: 'categories' }],
			attributes: { exclude: ['sizeStock'] }
		});
		
		if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
		
		// Add empty sizeStock for backward compatibility
		const productData = product.toJSON ? product.toJSON() : product;
		if (!productData.sizeStock) {
			productData.sizeStock = {};
		}
		product.sizeStock = product.sizeStock || {};

		// Parse categoryIds if it's a string (from FormData)
		let parsedCategoryIds = categoryIds;
		console.log('Received categoryIds:', categoryIds, 'Type:', typeof categoryIds);
		if (typeof categoryIds === 'string') {
			try {
				parsedCategoryIds = JSON.parse(categoryIds);
			} catch (e) {
				console.error('Failed to parse categoryIds:', e);
				parsedCategoryIds = [];
			}
		}
		// Ensure parsedCategoryIds is always an array (default to empty array if undefined)
		if (!Array.isArray(parsedCategoryIds)) {
			parsedCategoryIds = [];
		}
		console.log('Parsed categoryIds:', parsedCategoryIds);

		if (slug && slug !== product.slug) {
			const slugExists = await Product.count({ where: { slug } });
			if (slugExists) return res.status(400).json({ success: false, message: 'Slug already in use' });
		}
		if (SKU && SKU !== product.SKU) {
			const skuExists = await Product.count({ where: { SKU } });
			if (skuExists) return res.status(400).json({ success: false, message: 'SKU already in use' });
		}
		if (barcode && barcode !== product.barcode) {
			const barcodeExists = await Product.count({ where: { barcode } });
			if (barcodeExists) return res.status(400).json({ success: false, message: 'Barcode already in use' });
		}

		// Handle existing images order/removals sent from client
		let desiredExistingImages = null;
		if (typeof req.body.existingImages === 'string') {
			try {
				const parsed = JSON.parse(req.body.existingImages);
				if (Array.isArray(parsed)) {
					// Keep both Cloudinary URLs and local paths
					desiredExistingImages = parsed.filter((p) => 
						typeof p === 'string' && (p.startsWith('/uploads/') || p.includes('cloudinary.com'))
					);
				}
			} catch (_) {
				// ignore parse error; fall back to current product images
			}
		}

		let workingImages = Array.isArray(desiredExistingImages) ? desiredExistingImages : (product.images || []);

		// Handle multiple image uploads (append after existing images)
		if (req.cloudinaryUrls && req.cloudinaryUrls.length > 0) {
			// Use Cloudinary URLs if available
			workingImages = [...workingImages, ...req.cloudinaryUrls];
		} else if (req.files && req.files.length > 0) {
			// Fallback to local storage
			const sortedFiles = req.files.sort((a, b) => {
				const aIndex = parseInt(a.fieldname.replace('image_', ''));
				const bIndex = parseInt(b.fieldname.replace('image_', ''));
				return aIndex - bIndex;
			});
			const newImageUrls = sortedFiles.map(file => `/uploads/${file.filename}`);
			workingImages = [...workingImages, ...newImageUrls];
		}

		// Get main thumbnail index from request body and clamp
		const requestedMainIndex = parseInt(req.body.mainThumbnailIndex);
		const mainThumbnailIndex = Number.isFinite(requestedMainIndex) ? Math.max(0, Math.min(requestedMainIndex, Math.max(workingImages.length - 1, 0))) : 0;

		// Update product with final images
		product.images = workingImages;
		product.mainThumbnailIndex = mainThumbnailIndex;
		product.imageUrl = workingImages.length > 0 ? (workingImages[mainThumbnailIndex] || workingImages[0]) : null;

		if (name !== undefined) product.name = name;
		if (slug !== undefined) product.slug = slug;
		if (description !== undefined) product.description = description;
		if (SKU !== undefined) product.SKU = SKU;
		if (weightGrams !== undefined) product.weightGrams = weightGrams ? parseInt(weightGrams) : null;
		if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;
		if (displayBadge !== undefined) product.displayBadge = parseDisplayBadge(displayBadge);
		if (allowCustomerQuantity !== undefined) {
			product.allowCustomerQuantity = parseBooleanField(allowCustomerQuantity, false);
		}
		if (price !== undefined) product.price = parseFloat(price);
		if (compareAtPrice !== undefined) {
			const compare = compareAtPrice ? parseFloat(compareAtPrice) : null;
			const basePrice = price !== undefined ? parseFloat(price) : parseFloat(product.price);
			product.compareAtPrice =
				compare != null && Number.isFinite(compare) && Number.isFinite(basePrice) && compare > basePrice
					? compare
					: null;
		}
		// For made-to-order products with sizes, sizeStock is not used
		// Just set empty object for compatibility (column doesn't exist anyway)
		const finalSize = size !== undefined ? size : product.size;
		const hasSizes = finalSize && finalSize.trim().length > 0;
		
		// Set empty sizeStock (not used for made-to-order, column doesn't exist)
		product.sizeStock = {};
		
		// Set quantity - for products with sizes (made-to-order), quantity is not used for stock
		// For products without sizes, use the provided quantity
		if (quantity !== undefined) {
			if (hasSizes) {
				// Made-to-order: set quantity to 0 (not used for stock tracking)
				product.quantity = 0;
				console.log('Made-to-order product: setting quantity to 0 (not used for stock)');
			} else {
				// Regular product: use provided quantity
				product.quantity = parseInt(quantity) || 0;
				console.log('Setting quantity directly:', product.quantity);
			}
		}
		if (barcode !== undefined) product.barcode = barcode || null;
		if (size !== undefined) product.size = size || null;
		if (depthCm !== undefined) product.depthCm = parseOptionalDecimal(depthCm);
		if (widthCm !== undefined) product.widthCm = parseOptionalDecimal(widthCm);
		if (heightCm !== undefined) product.heightCm = parseOptionalDecimal(heightCm);
		if (outerMaterial !== undefined) product.outerMaterial = outerMaterial?.trim() || null;

		// Save product - exclude sizeStock since column doesn't exist
		const changedFields = product.changed();
		if (changedFields && Array.isArray(changedFields)) {
			const fieldsToSave = changedFields.filter(field => field !== 'sizeStock');
			await product.save({ fields: fieldsToSave });
		} else {
			// Save all fields except sizeStock
			const allFields = Object.keys(product.dataValues).filter(key => 
				key !== 'sizeStock' && key !== 'createdAt' && key !== 'updatedAt'
			);
			await product.save({ fields: allFields });
		}

		// Always update categories (even if empty array) to ensure state is synced
		const categories = parsedCategoryIds.length > 0 
			? await Category.findAll({ where: { id: parsedCategoryIds } })
			: [];
		console.log('Setting product categories:', categories.map(c => ({ id: c.id, name: c.name })));
		await product.setCategories(categories);

		if (req.body.variants !== undefined) {
			const skuError = await validateVariantSkus(req.body.variants, product.id);
			if (skuError) {
				return res.status(400).json({ success: false, message: skuError });
			}
			const savedVariants = await syncProductVariants(
				product.id,
				req.body.variants,
				product.SKU
			);
			if (savedVariants.length > 0) {
				product.quantity = computeProductStockFromVariants(savedVariants);
				await product.save();
			} else if (parseVariantsPayload(req.body.variants).length === 0) {
				await ProductVariant.destroy({ where: { productId: product.id } });
			}
		}

		// Fetch updated product - always exclude sizeStock
		const updated = await Product.findByPk(product.id, { 
			include: [
				{ model: Category, as: 'categories', through: { attributes: [] } },
				variantInclude
			],
			attributes: { exclude: ['sizeStock'] }
		});
		
		let isAdmin = false;
		if (req.user && req.user.userId) {
			try {
				const user = await User.findByPk(req.user.userId, { attributes: ['isAdmin'] });
				isAdmin = user && user.isAdmin === true;
			} catch (error) {
				console.error('Error checking admin status:', error);
			}
		}

		const formattedProduct = formatProductForUser(updated, isAdmin);
		res.json({ success: true, message: 'Product updated', data: { product: formattedProduct } });
	} catch (error) {
		console.error('Update product error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Delete product (admin)
const deleteProduct = async (req, res) => {
	try {
		const { id } = req.params;
		// Always exclude sizeStock since column doesn't exist
		const product = await Product.findByPk(id, {
			attributes: { exclude: ['sizeStock'] }
		});
		if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
		await product.destroy();
		res.json({ success: true, message: 'Product deleted' });
	} catch (error) {
		console.error('Delete product error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Manage categories for a product
const setProductCategories = async (req, res) => {
	try {
		const { id } = req.params;
		const { categoryIds } = req.body;
		// Always exclude sizeStock since column doesn't exist
		const product = await Product.findByPk(id, {
			attributes: { exclude: ['sizeStock'] }
		});
		if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
		if (!Array.isArray(categoryIds)) return res.status(400).json({ success: false, message: 'categoryIds must be an array' });
		const categories = await Category.findAll({ where: { id: categoryIds } });
		await product.setCategories(categories);
		const updated = await Product.findByPk(id, { 
			include: [{ model: Category, as: 'categories', through: { attributes: [] } }],
			attributes: { exclude: ['sizeStock'] }
		});
		res.json({ success: true, data: { product: updated } });
	} catch (error) {
		console.error('Set product categories error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Search autocomplete - returns products, categories, and popular products
const searchAutocomplete = async (req, res) => {
	try {
		const { q } = req.query;
		const searchTerm = q ? q.trim() : '';
		const limit = 5; // Limit results per type

		const results = {
			products: [],
			categories: [],
			popularProducts: []
		};

		// If there's a search term, search products and categories
		if (searchTerm.length > 0) {
			// Search products
			try {
				const escapedTerm = searchTerm.replace(/'/g, "''").replace(/[\\]/g, '\\\\');
				const products = await Product.findAll({
					where: {
						isActive: true,
						[Op.or]: [
							sequelize.literal(`to_tsvector('english', COALESCE("name", '') || ' ' || COALESCE("description", '')) @@ plainto_tsquery('english', '${escapedTerm}')`),
							{ name: { [Op.iLike]: `%${searchTerm}%` } },
							{ SKU: { [Op.iLike]: `%${searchTerm}%` } }
						]
					},
					include: [{ model: Category, as: 'categories', through: { attributes: [] } }],
					attributes: { exclude: ['sizeStock'] },
					limit,
					order: [['name', 'ASC']]
				});

				results.products = products.map(p => formatProductForUser(p, false));
			} catch (error) {
				// Fallback to ILIKE if full-text search fails
				const products = await Product.findAll({
					where: {
						isActive: true,
						[Op.or]: [
							{ name: { [Op.iLike]: `%${searchTerm}%` } },
							{ SKU: { [Op.iLike]: `%${searchTerm}%` } }
						]
					},
					include: [{ model: Category, as: 'categories', through: { attributes: [] } }],
					attributes: { exclude: ['sizeStock'] },
					limit,
					order: [['name', 'ASC']]
				});
				results.products = products.map(p => formatProductForUser(p, false));
			}

			// Search categories
			const categories = await Category.findAll({
				where: {
					isActive: true,
					name: { [Op.iLike]: `%${searchTerm}%` }
				},
				limit,
				order: [['name', 'ASC']]
			});
			results.categories = categories.map(c => ({
				id: c.id,
				name: c.name,
				slug: c.slug
			}));
		}

		// Always include popular products (most recently created active products)
		const popularProducts = await Product.findAll({
			where: { isActive: true },
			include: [{ model: Category, as: 'categories', through: { attributes: [] } }],
			attributes: { exclude: ['sizeStock'] },
			limit: 5,
			order: [['createdAt', 'DESC']]
		});
		results.popularProducts = popularProducts.map(p => formatProductForUser(p, false));

		res.json({ success: true, data: results });
	} catch (error) {
		console.error('Search autocomplete error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Update product display badge (admin, quick toggle from list)
const updateProductDisplayBadge = async (req, res) => {
	try {
		const { id } = req.params;
		const { displayBadge } = req.body;

		const product = await Product.findByPk(id, {
			attributes: { exclude: ['sizeStock'] }
		});
		if (!product) {
			return res.status(404).json({ success: false, message: 'Product not found' });
		}

		product.displayBadge = parseDisplayBadge(displayBadge);
		await product.save();

		const formattedProduct = formatProductForUser(product, true);
		res.json({ success: true, data: { product: formattedProduct } });
	} catch (error) {
		console.error('Update product display badge error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

module.exports = {
	createProduct,
	listProducts,
	getProduct,
	updateProduct,
	updateProductDisplayBadge,
	deleteProduct,
	setProductCategories,
	searchAutocomplete
};






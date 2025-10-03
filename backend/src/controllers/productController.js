const { Op } = require('sequelize');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const path = require('path');
const { withTimeout, TIMEOUTS, handleTimeoutError } = require('../utils/queryTimeout');

// Ensure associations are loaded
require('../models/associations');

// Helper function to format product data based on user role
const formatProductForUser = (product, isAdmin = false) => {
	const productData = product.toJSON ? product.toJSON() : product;
	
	if (isAdmin) {
		// Admin sees exact stock numbers
		return {
			...productData,
			stockInfo: {
				quantity: productData.quantity,
				status: productData.quantity > 10 ? 'In Stock' : 
				        productData.quantity > 0 ? 'Low Stock' : 'Out of Stock',
				isInStock: productData.quantity > 0,
				isLowStock: productData.quantity > 0 && productData.quantity <= 10
			}
		};
	} else {
		// Regular users see stock status with low stock indicator
		return {
			...productData,
			stockInfo: {
				status: productData.quantity > 10 ? 'In Stock' : 
				        productData.quantity > 0 ? 'Low Stock' : 'Out of Stock',
				isInStock: productData.quantity > 0,
				isLowStock: productData.quantity > 0 && productData.quantity <= 10
			}
		};
	}
};

// Create product (admin)
const createProduct = async (req, res) => {
	try {
		const { name, slug, description, SKU, weightGrams, isActive, categoryIds, price, compareAtPrice, quantity, barcode } = req.body;
		
		// Parse categoryIds if it's a string (from FormData)
		let parsedCategoryIds = categoryIds;
		if (typeof categoryIds === 'string') {
			try {
				parsedCategoryIds = JSON.parse(categoryIds);
			} catch (e) {
				parsedCategoryIds = [];
			}
		}

		const existing = await Product.findOne({ where: { [Op.or]: [{ slug }, { SKU }, ...(barcode ? [{ barcode }] : [])] } });
		if (existing) {
			return res.status(400).json({ success: false, message: 'Product with slug, SKU, or barcode already exists' });
		}

		// Handle multiple image uploads
		let imageUrls = [];
		if (req.files && req.files.length > 0) {
			// Sort files by field name to maintain order (image_0, image_1, etc.)
			const sortedFiles = req.files.sort((a, b) => {
				const aIndex = parseInt(a.fieldname.replace('image_', ''));
				const bIndex = parseInt(b.fieldname.replace('image_', ''));
				return aIndex - bIndex;
			});
			
			// Generate URLs for the uploaded images
			imageUrls = sortedFiles.map(file => `/uploads/${file.filename}`);
		}

		// Get main thumbnail index from request body
		const mainThumbnailIndex = parseInt(req.body.mainThumbnailIndex) || 0;

		const product = await Product.create({ 
			name, 
			slug, 
			description, 
			SKU, 
			weightGrams: weightGrams ? parseInt(weightGrams) : null, 
			isActive: isActive === 'true' || isActive === true, 
			imageUrl: imageUrls.length > 0 ? imageUrls[mainThumbnailIndex] || imageUrls[0] : null, // Use selected thumbnail as main image
			images: imageUrls, // Store all images
			mainThumbnailIndex: mainThumbnailIndex, // Store the selected thumbnail index
			price: parseFloat(price),
			compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
			quantity: parseInt(quantity) || 0,
			barcode: barcode || null
		});

		if (Array.isArray(parsedCategoryIds) && parsedCategoryIds.length) {
			const categories = await Category.findAll({ where: { id: parsedCategoryIds } });
			await product.setCategories(categories);
		}

		const created = await Product.findByPk(product.id, { include: [{ model: Category, as: 'categories' }] });
		res.status(201).json({ success: true, data: { product: created } });
	} catch (error) {
		console.error('Create product error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// List products with pagination and filters
	const listProducts = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 12;
		const offset = (page - 1) * limit;
		const { q, active, categoryId, sort, order } = req.query;

		const where = {};
		if (q) {
			where[Op.or] = [
				{ name: { [Op.iLike]: `%${q}%` } },
				{ description: { [Op.iLike]: `%${q}%` } },
				{ SKU: { [Op.iLike]: `%${q}%` } }
			];
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

		const { count, rows } = await withTimeout(
			Product.findAndCountAll({
				where,
				include,
				order: orderClause,
				limit,
				offset,
				distinct: true
			}),
			TIMEOUTS.COMPLEX_QUERY,
			'Product listing query'
		);

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
		res.json({ success: true, data: { products: formattedProducts, pagination: { currentPage: page, totalPages, totalProducts: count, perPage: limit } } });
	} catch (error) {
		return handleTimeoutError(error, res, 'List products');
	}
};

// Get single product by slug or id
const getProduct = async (req, res) => {
	try {
		const { idOrSlug } = req.params;
		const where = /^(\d+)$/.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
		const product = await Product.findOne({ where, include: [{ model: Category, as: 'categories', through: { attributes: [] } }] });
		if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
		
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
		
		// Format product based on user role
		const formattedProduct = formatProductForUser(product, isAdmin);
		
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
		const { name, slug, description, SKU, weightGrams, isActive, categoryIds, price, compareAtPrice, quantity, barcode } = req.body;
		const product = await Product.findByPk(id, { include: [{ model: Category, as: 'categories' }] });
		if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

		// Parse categoryIds if it's a string (from FormData)
		let parsedCategoryIds = categoryIds;
		if (typeof categoryIds === 'string') {
			try {
				parsedCategoryIds = JSON.parse(categoryIds);
			} catch (e) {
				parsedCategoryIds = [];
			}
		}

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
					// Sanitize: keep only strings that look like our uploads path
					desiredExistingImages = parsed.filter((p) => typeof p === 'string' && p.startsWith('/uploads/'));
				}
			} catch (_) {
				// ignore parse error; fall back to current product images
			}
		}

		let workingImages = Array.isArray(desiredExistingImages) ? desiredExistingImages : (product.images || []);

		// Handle multiple image uploads (append after existing images)
		if (req.files && req.files.length > 0) {
			// Sort files by field name to maintain order (image_0, image_1, etc.)
			const sortedFiles = req.files.sort((a, b) => {
				const aIndex = parseInt(a.fieldname.replace('image_', ''));
				const bIndex = parseInt(b.fieldname.replace('image_', ''));
				return aIndex - bIndex;
			});
			// Generate URLs for the new uploaded images
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
		if (price !== undefined) product.price = parseFloat(price);
		if (compareAtPrice !== undefined) product.compareAtPrice = compareAtPrice ? parseFloat(compareAtPrice) : null;
		if (quantity !== undefined) product.quantity = parseInt(quantity) || 0;
		if (barcode !== undefined) product.barcode = barcode || null;

		await product.save();

		if (Array.isArray(parsedCategoryIds)) {
			const categories = await Category.findAll({ where: { id: parsedCategoryIds } });
			await product.setCategories(categories);
		}

		const updated = await Product.findByPk(product.id, { include: [{ model: Category, as: 'categories', through: { attributes: [] } }] });
		res.json({ success: true, message: 'Product updated', data: { product: updated } });
	} catch (error) {
		console.error('Update product error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Delete product (admin)
const deleteProduct = async (req, res) => {
	try {
		const { id } = req.params;
		const product = await Product.findByPk(id);
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
		const product = await Product.findByPk(id);
		if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
		if (!Array.isArray(categoryIds)) return res.status(400).json({ success: false, message: 'categoryIds must be an array' });
		const categories = await Category.findAll({ where: { id: categoryIds } });
		await product.setCategories(categories);
		const updated = await Product.findByPk(id, { include: [{ model: Category, as: 'categories', through: { attributes: [] } }] });
		res.json({ success: true, data: { product: updated } });
	} catch (error) {
		console.error('Set product categories error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

module.exports = {
	createProduct,
	listProducts,
	getProduct,
	updateProduct,
	deleteProduct,
	setProductCategories
};






const { Op } = require('sequelize');
const { Collection, Product, ProductCollection } = require('../models/associations');

// List collections
const listCollections = async (req, res) => {
	try {
		const { page = 1, limit = 20, active } = req.query;
		const offset = (page - 1) * limit;
		
		const where = {};
		if (active !== undefined) {
			where.isActive = active === 'true';
		}

    const pageInt = parseInt(page);
        const limitInt = parseInt(limit);

        const { count, rows: collections } = await Collection.findAndCountAll({
            where,
            limit: limitInt,
            offset: (pageInt - 1) * limitInt,
            order: [['sortOrder', 'ASC'], ['name', 'ASC']],
            distinct: true,
            include: [{
                model: Product,
                as: 'products',
                attributes: [
                    'id',
                    'name',
                    'slug',
                    'price',
                    'compareAtPrice',
                    'imageUrl',
                    'isActive'
                ],
                through: { attributes: ['position'] },
                order: [[ProductCollection, 'position', 'ASC']]
            }]
        });

		res.json({
			success: true,
			data: {
				collections,
                pagination: {
                    total: count,
                    page: pageInt,
                    limit: limitInt,
                    pages: Math.ceil(count / limitInt)
                }
			}
		});
	} catch (error) {
		console.error('List collections error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Get single collection by slug or id
const getCollection = async (req, res) => {
	try {
		const { idOrSlug } = req.params;
		const where = /^(\d+)$/.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
		
		const collection = await Collection.findOne({
			where,
			include: [{
				model: Product,
				as: 'products',
				through: { attributes: ['position'] },
				order: [[ProductCollection, 'position', 'ASC']]
			}]
		});

		if (!collection) {
			return res.status(404).json({ success: false, message: 'Collection not found' });
		}

		res.json({ success: true, data: { collection } });
	} catch (error) {
		console.error('Get collection error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Create collection (admin)
const createCollection = async (req, res) => {
	try {
		const { name, slug, description, imageUrl, isActive, sortOrder, collectionType, conditions, productIds } = req.body;

		// Check if slug already exists
		const existing = await Collection.findOne({ where: { slug } });
		if (existing) {
			return res.status(400).json({ success: false, message: 'Collection with this slug already exists' });
		}

		const collection = await Collection.create({
			name,
			slug,
			description,
			imageUrl,
			isActive: isActive !== false,
			sortOrder: sortOrder || 0,
			collectionType: collectionType || 'manual',
			conditions: conditions ? JSON.parse(conditions) : null
		});

		// Add products to collection if provided
		if (productIds && Array.isArray(productIds)) {
			const products = await Product.findAll({ where: { id: productIds } });
			await collection.setProducts(products);
		}

		const created = await Collection.findByPk(collection.id, {
			include: [{ model: Product, as: 'products' }]
		});

		res.status(201).json({ success: true, data: { collection: created } });
	} catch (error) {
		console.error('Create collection error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Update collection (admin)
const updateCollection = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, slug, description, imageUrl, isActive, sortOrder, collectionType, conditions, productIds } = req.body;

		const collection = await Collection.findByPk(id);
		if (!collection) {
			return res.status(404).json({ success: false, message: 'Collection not found' });
		}

		// Check if slug already exists (excluding current collection)
		if (slug && slug !== collection.slug) {
			const slugExists = await Collection.count({ where: { slug, id: { [Op.ne]: id } } });
			if (slugExists) {
				return res.status(400).json({ success: false, message: 'Slug already in use' });
			}
		}

		await collection.update({
			name: name || collection.name,
			slug: slug || collection.slug,
			description: description !== undefined ? description : collection.description,
			imageUrl: imageUrl !== undefined ? imageUrl : collection.imageUrl,
			isActive: isActive !== undefined ? isActive : collection.isActive,
			sortOrder: sortOrder !== undefined ? sortOrder : collection.sortOrder,
			collectionType: collectionType || collection.collectionType,
			conditions: conditions ? JSON.parse(conditions) : collection.conditions
		});

		// Update products if provided
		if (productIds !== undefined) {
			if (Array.isArray(productIds)) {
				const products = await Product.findAll({ where: { id: productIds } });
				await collection.setProducts(products);
			} else {
				await collection.setProducts([]);
			}
		}

		const updated = await Collection.findByPk(collection.id, {
			include: [{ model: Product, as: 'products' }]
		});

		res.json({ success: true, data: { collection: updated } });
	} catch (error) {
		console.error('Update collection error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Delete collection (admin)
const deleteCollection = async (req, res) => {
	try {
		const { id } = req.params;
		const collection = await Collection.findByPk(id);
		
		if (!collection) {
			return res.status(404).json({ success: false, message: 'Collection not found' });
		}

		await collection.destroy();
		res.json({ success: true, message: 'Collection deleted successfully' });
	} catch (error) {
		console.error('Delete collection error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Add product to collection (admin)
const addProductToCollection = async (req, res) => {
	try {
		const { collectionId, productId } = req.params;
		const { position } = req.body;

		const collection = await Collection.findByPk(collectionId);
		const product = await Product.findByPk(productId);

		if (!collection) {
			return res.status(404).json({ success: false, message: 'Collection not found' });
		}
		if (!product) {
			return res.status(404).json({ success: false, message: 'Product not found' });
		}

		await collection.addProduct(product, { through: { position: position || 0 } });

		res.json({ success: true, message: 'Product added to collection' });
	} catch (error) {
		console.error('Add product to collection error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Remove product from collection (admin)
const removeProductFromCollection = async (req, res) => {
	try {
		const { collectionId, productId } = req.params;

		const collection = await Collection.findByPk(collectionId);
		const product = await Product.findByPk(productId);

		if (!collection) {
			return res.status(404).json({ success: false, message: 'Collection not found' });
		}
		if (!product) {
			return res.status(404).json({ success: false, message: 'Product not found' });
		}

		await collection.removeProduct(product);
		res.json({ success: true, message: 'Product removed from collection' });
	} catch (error) {
		console.error('Remove product from collection error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

module.exports = {
	listCollections,
	getCollection,
	createCollection,
	updateCollection,
	deleteCollection,
	addProductToCollection,
	removeProductFromCollection
};

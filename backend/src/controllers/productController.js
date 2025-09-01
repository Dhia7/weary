const { Op } = require('sequelize');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Create product (admin)
const createProduct = async (req, res) => {
	try {
		const { name, slug, description, SKU, weightGrams, isActive, categoryIds } = req.body;

		const existing = await Product.findOne({ where: { [Op.or]: [{ slug }, { SKU }] } });
		if (existing) {
			return res.status(400).json({ success: false, message: 'Product with slug or SKU already exists' });
		}

		const product = await Product.create({ name, slug, description, SKU, weightGrams, isActive });

		if (Array.isArray(categoryIds) && categoryIds.length) {
			const categories = await Category.findAll({ where: { id: categoryIds } });
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
		const { q, active, categoryId } = req.query;

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

		const { count, rows } = await Product.findAndCountAll({
			where,
			include,
			order: [['createdAt', 'DESC']],
			limit,
			offset,
			distinct: true
		});

		const totalPages = Math.ceil(count / limit);
		res.json({ success: true, data: { products: rows, pagination: { currentPage: page, totalPages, totalProducts: count, perPage: limit } } });
	} catch (error) {
		console.error('List products error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Get single product by slug or id
const getProduct = async (req, res) => {
	try {
		const { idOrSlug } = req.params;
		const where = /^(\d+)$/.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
		const product = await Product.findOne({ where, include: [{ model: Category, as: 'categories', through: { attributes: [] } }] });
		if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
		res.json({ success: true, data: { product } });
	} catch (error) {
		console.error('Get product error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Update product (admin)
const updateProduct = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, slug, description, SKU, weightGrams, isActive, categoryIds } = req.body;
		const product = await Product.findByPk(id, { include: [{ model: Category, as: 'categories' }] });
		if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

		if (slug && slug !== product.slug) {
			const slugExists = await Product.count({ where: { slug } });
			if (slugExists) return res.status(400).json({ success: false, message: 'Slug already in use' });
		}
		if (SKU && SKU !== product.SKU) {
			const skuExists = await Product.count({ where: { SKU } });
			if (skuExists) return res.status(400).json({ success: false, message: 'SKU already in use' });
		}

		if (name !== undefined) product.name = name;
		if (slug !== undefined) product.slug = slug;
		if (description !== undefined) product.description = description;
		if (SKU !== undefined) product.SKU = SKU;
		if (weightGrams !== undefined) product.weightGrams = weightGrams;
		if (isActive !== undefined) product.isActive = isActive;

		await product.save();

		if (Array.isArray(categoryIds)) {
			const categories = await Category.findAll({ where: { id: categoryIds } });
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



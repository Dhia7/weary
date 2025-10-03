const { Op } = require('sequelize');
const Category = require('../models/Category');
const { withTimeout, TIMEOUTS, handleTimeoutError } = require('../utils/queryTimeout');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

// Ensure associations are loaded
require('../models/associations');

// List all categories
const listCategories = async (req, res) => {
	try {
		console.log('List categories called');
		
		// Force a fresh query without any caching
		const categories = await Category.findAll({
			where: { isActive: true },
			order: [['name', 'ASC']],
			raw: false,
			benchmark: false
		});
		
		console.log('Found categories:', categories.length);
		categories.forEach(cat => console.log(`- ${cat.name} (${cat.slug})`));
		
		// If we get less than 10 categories, something is wrong
		if (categories.length < 10) {
			console.log('WARNING: Only found', categories.length, 'categories, expected more!');
			// Try to get all categories regardless of isActive
			const allCategories = await Category.findAll({
				order: [['name', 'ASC']]
			});
			console.log('All categories in database:', allCategories.length);
			allCategories.forEach(cat => console.log(`- ${cat.name} (${cat.slug}) - Active: ${cat.isActive}`));
		}
		
		res.json({ success: true, data: { categories } });
	} catch (error) {
		console.error('List categories error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Get single category
const getCategory = async (req, res) => {
	try {
		const { idOrSlug } = req.params;
		const category = await Category.findOne({
			where: {
				[Op.or]: [
					{ id: isNaN(idOrSlug) ? null : parseInt(idOrSlug) },
					{ slug: idOrSlug }
				]
			}
		});
		if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
		res.json({ success: true, data: { category } });
	} catch (error) {
		console.error('Get category error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Get products in a category
const getCategoryProducts = async (req, res) => {
	try {
		const { idOrSlug } = req.params;
		const { page = 1, limit = 20, sort = 'name', order = 'ASC' } = req.query;
		
		console.log('Getting products for category:', idOrSlug);
		
		// Find category by ID or slug with timeout protection
		const category = await withTimeout(
			Category.findOne({
				where: {
					[Op.or]: [
						{ id: isNaN(idOrSlug) ? null : parseInt(idOrSlug) },
						{ slug: idOrSlug }
					]
				}
			}),
			TIMEOUTS.SIMPLE_QUERY,
			'Category lookup query'
		);
		
		if (!category) {
			console.log('Category not found:', idOrSlug);
			return res.status(404).json({ success: false, message: 'Category not found' });
		}

		console.log('Found category:', category.name, 'ID:', category.id);

		const offset = (page - 1) * limit;
		
		// Get products in this category using raw query
		const { sequelize } = require('../config/database');
		
		// First get the count
		const countResult = await sequelize.query(`
			SELECT COUNT(DISTINCT p.id) as count
			FROM "Product" p
			INNER JOIN "ProductCategory" pc ON p.id = pc."productId"
			WHERE pc."categoryId" = :categoryId AND p."isActive" = true
		`, {
			replacements: { categoryId: category.id },
			type: sequelize.QueryTypes.SELECT
		});
		
		const count = parseInt(countResult[0].count);
		console.log('Product count:', count);
		
		// Handle sorting
		let orderClause = 'p."createdAt" DESC'; // Default sort
		if (sort && order) {
			const validSortFields = ['name', 'price', 'createdAt', 'updatedAt'];
			const validOrders = ['ASC', 'DESC'];
			
			if (validSortFields.includes(sort) && validOrders.includes(order.toUpperCase())) {
				orderClause = `p."${sort}" ${order.toUpperCase()}`;
			}
		}

		// Then get the products with their categories
		const products = await sequelize.query(`
			SELECT p.*, 
			       json_agg(
			         json_build_object(
			           'id', c.id,
			           'name', c.name,
			           'slug', c.slug
			         )
			       ) as categories
			FROM "Product" p
			INNER JOIN "ProductCategory" pc ON p.id = pc."productId"
			INNER JOIN "Category" c ON pc."categoryId" = c.id
			WHERE pc."categoryId" = :categoryId AND p."isActive" = true
			GROUP BY p.id
			ORDER BY ${orderClause}
			LIMIT :limit OFFSET :offset
		`, {
			replacements: { 
				categoryId: category.id,
				limit: parseInt(limit),
				offset: parseInt(offset)
			},
			type: sequelize.QueryTypes.SELECT
		});

		console.log('Found products:', products.length);

		res.json({
			success: true,
			data: {
				category,
				products,
				pagination: {
					currentPage: parseInt(page),
					totalPages: Math.ceil(count / limit),
					totalProducts: count,
					hasNext: page * limit < count,
					hasPrev: page > 1
				}
			}
		});
	} catch (error) {
		console.error('Get category products error:', error);
		console.error('Error details:', error.message);
		console.error('Error stack:', error.stack);
		return handleTimeoutError(error, res, 'Get category products');
	}
};

// Create category (admin)
const createCategory = async (req, res) => {
	try {
		const { name, slug, description, isActive } = req.body;
		
		const existing = await Category.findOne({ where: { [Op.or]: [{ name }, { slug }] } });
		if (existing) {
			return res.status(400).json({ success: false, message: 'Category with name or slug already exists' });
		}

		const category = await Category.create({ name, slug, description, isActive });
		res.status(201).json({ success: true, data: { category } });
	} catch (error) {
		console.error('Create category error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Update category (admin)
const updateCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, slug, description, isActive } = req.body;
		const category = await Category.findByPk(id);
		if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

		if (name !== undefined) category.name = name;
		if (slug !== undefined) category.slug = slug;
		if (description !== undefined) category.description = description;
		if (isActive !== undefined) category.isActive = isActive;

		await category.save();
		res.json({ success: true, message: 'Category updated', data: { category } });
	} catch (error) {
		console.error('Update category error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Delete category (admin)
const deleteCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const category = await Category.findByPk(id);
		if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
		await category.destroy();
		res.json({ success: true, message: 'Category deleted' });
	} catch (error) {
		console.error('Delete category error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

module.exports = {
	listCategories,
	getCategory,
	getCategoryProducts,
	createCategory,
	updateCategory,
	deleteCategory
};

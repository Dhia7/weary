const { Op } = require('sequelize');
const Category = require('../models/Category');

// List all categories
const listCategories = async (req, res) => {
	try {
		const categories = await Category.findAll({
			where: { isActive: true },
			order: [['name', 'ASC']]
		});
		res.json({ success: true, data: { categories } });
	} catch (error) {
		console.error('List categories error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

// Get single category
const getCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const category = await Category.findByPk(id);
		if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
		res.json({ success: true, data: { category } });
	} catch (error) {
		console.error('Get category error:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
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
	createCategory,
	updateCategory,
	deleteCategory
};

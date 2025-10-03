const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('./Product');
const Category = require('./Category');

// Join table for many-to-many Product <-> Category
const ProductCategory = sequelize.define('ProductCategory', {
	productId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
		references: {
			model: Product,
			key: 'id'
		},
		onDelete: 'CASCADE'
	},
	categoryId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
		references: {
			model: Category,
			key: 'id'
		},
		onDelete: 'CASCADE'
	}
}, {
	timestamps: false,
	indexes: [
		{ unique: true, fields: ['productId', 'categoryId'] },
		{ fields: ['categoryId'] }
	]
});

module.exports = ProductCategory;
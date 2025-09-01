const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('./Product');
const Category = require('./Category');

// Join table for many-to-many Product <-> Category
const ProductCategory = sequelize.define('ProductCategory', {
	productId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: Product,
			key: 'id'
		},
		onDelete: 'CASCADE'
	},
	categoryId: {
		type: DataTypes.INTEGER,
		allowNull: false,
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

Product.belongsToMany(Category, { through: ProductCategory, foreignKey: 'productId', otherKey: 'categoryId', as: 'categories' });
Category.belongsToMany(Product, { through: ProductCategory, foreignKey: 'categoryId', otherKey: 'productId', as: 'products' });

module.exports = ProductCategory;



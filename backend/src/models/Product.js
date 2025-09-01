const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Core product information kept normalized
const Product = sequelize.define('Product', {
	name: {
		type: DataTypes.STRING(200),
		allowNull: false,
		validate: {
			len: [2, 200]
		}
	},
	slug: {
		type: DataTypes.STRING(220),
		allowNull: false,
		unique: true
	},
	description: {
		type: DataTypes.TEXT,
		allowNull: true
	},
	SKU: {
		type: DataTypes.STRING(100),
		allowNull: false,
		unique: true
	},
	weightGrams: {
		type: DataTypes.INTEGER,
		allowNull: true,
		validate: {
			min: 0
		}
	},
	isActive: {
		type: DataTypes.BOOLEAN,
		defaultValue: true
	}
}, {
	timestamps: true,
	indexes: [
		{ unique: true, fields: ['slug'] },
		{ unique: true, fields: ['SKU'] },
		{ fields: ['name'] }
	]
});

module.exports = Product;



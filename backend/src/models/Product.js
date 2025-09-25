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
	},
	imageUrl: {
		type: DataTypes.STRING(500),
		allowNull: true
	},
	images: {
		type: DataTypes.JSON,
		allowNull: true,
		defaultValue: [],
		comment: 'Array of image URLs for the product'
	},
	mainThumbnailIndex: {
		type: DataTypes.INTEGER,
		allowNull: true,
		defaultValue: 0,
		comment: 'Index of the main thumbnail image in the images array'
	},
	price: {
		type: DataTypes.DECIMAL(12, 2),
		allowNull: false,
		validate: {
			min: 0
		}
	},
	compareAtPrice: {
		type: DataTypes.DECIMAL(12, 2),
		allowNull: true,
		validate: {
			min: 0
		}
	},
	quantity: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
		validate: {
			min: 0
		}
	},
	barcode: {
		type: DataTypes.STRING(100),
		allowNull: true,
		unique: true
	}
}, {
	timestamps: true,
	indexes: [
		{ unique: true, fields: ['slug'] },
		{ unique: true, fields: ['SKU'] },
		{ unique: true, fields: ['barcode'] },
		{ fields: ['name'] },
		{ fields: ['price'] }
	]
});

module.exports = Product;
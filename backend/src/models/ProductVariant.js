const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductVariant = sequelize.define('ProductVariant', {
	productId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: { model: 'Product', key: 'id' }
	},
	SKU: {
		type: DataTypes.STRING(100),
		allowNull: false,
		unique: true
	},
	color: {
		type: DataTypes.STRING(80),
		allowNull: false,
		comment: 'Canonical color name (EN identity) e.g. Red, Navy'
	},
	colorFr: {
		type: DataTypes.STRING(80),
		allowNull: true,
		comment: 'French display color name; falls back to color on storefront'
	},
	colorCode: {
		type: DataTypes.STRING(20),
		allowNull: true,
		comment: 'Short code for SKU e.g. RED, NVY'
	},
	colorHex: {
		type: DataTypes.STRING(7),
		allowNull: true,
		comment: 'Hex swatch e.g. #FF0000'
	},
	size: {
		type: DataTypes.STRING(50),
		allowNull: true,
		comment: 'Size when applicable e.g. 42, M'
	},
	quantity: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
		validate: { min: 0 }
	},
	price: {
		type: DataTypes.DECIMAL(12, 2),
		allowNull: true,
		comment: 'Override price; null uses parent product price'
	},
	compareAtPrice: {
		type: DataTypes.DECIMAL(12, 2),
		allowNull: true
	},
	imageUrl: {
		type: DataTypes.STRING(500),
		allowNull: true
	},
	images: {
		type: DataTypes.JSON,
		allowNull: true,
		defaultValue: []
	},
	isActive: {
		type: DataTypes.BOOLEAN,
		defaultValue: true
	},
	sortOrder: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0
	}
}, {
	timestamps: true,
	indexes: [
		{ fields: ['productId'] },
		{ unique: true, fields: ['SKU'] },
		{ fields: ['productId', 'color', 'size'] }
	]
});

module.exports = ProductVariant;

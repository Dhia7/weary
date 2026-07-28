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
	nameFr: {
		type: DataTypes.STRING(200),
		allowNull: true,
		comment: 'French display title; falls back to name on storefront'
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
	displayBadge: {
		type: DataTypes.STRING(20),
		allowNull: true,
		defaultValue: null,
		validate: {
			isIn: [['new_arrival', 'sold']]
		},
		comment: 'Optional storefront badge: new_arrival, sold, or null for none'
	},
	allowCustomerQuantity: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
		comment: 'When true, customers can choose quantity on the storefront'
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
	defaultDisplayColor: {
		type: DataTypes.STRING(100),
		allowNull: true,
		defaultValue: null,
		comment: 'Variant color shown first on featured products and listings'
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
	},
	size: {
		type: DataTypes.STRING(50),
		allowNull: true,
		comment: 'Product size (e.g., XS, S, M, L, XL, XXL) - optional for products without sizes'
	},
	depthCm: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: true,
		validate: { min: 0 }
	},
	widthCm: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: true,
		validate: { min: 0 }
	},
	heightCm: {
		type: DataTypes.DECIMAL(10, 2),
		allowNull: true,
		validate: { min: 0 }
	},
	outerMaterial: {
		type: DataTypes.STRING(200),
		allowNull: true
	}
	// sizeStock removed - column doesn't exist in database and products with sizes are made-to-order
}, {
	timestamps: true,
	indexes: [
		{ unique: true, fields: ['slug'] },
		{ unique: true, fields: ['SKU'] },
		{ unique: true, fields: ['barcode'] },
		{ fields: ['name'] },
		{ fields: ['price'] }
	],
	omitNull: false
	// sizeStock field removed from model - column doesn't exist in database
});

module.exports = Product;
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('./Product');
const Collection = require('./Collection');

// Join table for many-to-many Product <-> Collection
const ProductCollection = sequelize.define('ProductCollection', {
	productId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: Product,
			key: 'id'
		},
		onDelete: 'CASCADE'
	},
	collectionId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: {
			model: Collection,
			key: 'id'
		},
		onDelete: 'CASCADE'
	},
	position: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		comment: 'Position of product within the collection'
	}
}, {
	timestamps: false,
	indexes: [
		{ unique: true, fields: ['productId', 'collectionId'] },
		{ fields: ['collectionId'] },
		{ fields: ['position'] }
	]
});

// Associations are defined in the respective model files to avoid circular dependencies

module.exports = ProductCollection;

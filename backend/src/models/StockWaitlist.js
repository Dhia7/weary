const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockWaitlist = sequelize.define('StockWaitlist', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	productId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		references: { model: 'Product', key: 'id' }
	},
	variantId: {
		type: DataTypes.INTEGER,
		allowNull: true,
		references: { model: 'ProductVariant', key: 'id' }
	},
	email: {
		type: DataTypes.STRING(255),
		allowNull: false
	},
	phone: {
		type: DataTypes.STRING(40),
		allowNull: true
	},
	userId: {
		type: DataTypes.INTEGER,
		allowNull: true,
		references: { model: 'User', key: 'id' }
	},
	notifiedAt: {
		type: DataTypes.DATE,
		allowNull: true
	}
}, {
	timestamps: true,
	indexes: [
		{ fields: ['productId', 'variantId', 'email'], unique: true },
		{ fields: ['productId'] },
		{ fields: ['notifiedAt'] }
	]
});

module.exports = StockWaitlist;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
	name: {
		type: DataTypes.STRING(120),
		allowNull: false,
		unique: true,
		validate: {
			len: [2, 120]
		}
	},
	slug: {
		type: DataTypes.STRING(140),
		allowNull: false,
		unique: true
	},
	description: {
		type: DataTypes.TEXT,
		allowNull: true
	},
	isActive: {
		type: DataTypes.BOOLEAN,
		defaultValue: true
	}
}, {
	timestamps: true,
	indexes: [
		{ unique: true, fields: ['slug'] },
		{ fields: ['name'] }
	]
});

module.exports = Category;



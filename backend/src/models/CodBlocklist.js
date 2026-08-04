const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CodBlocklist = sequelize.define('CodBlocklist', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	phone: {
		type: DataTypes.STRING(40),
		allowNull: true,
		comment: 'Normalized phone digits'
	},
	email: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: 'Lowercased email'
	},
	reason: {
		type: DataTypes.STRING(80),
		allowNull: false,
		defaultValue: 'refused_at_delivery'
	},
	orderId: {
		type: DataTypes.UUID,
		allowNull: true
	}
}, {
	timestamps: true,
	indexes: [
		{ fields: ['phone'] },
		{ fields: ['email'] }
	]
});

module.exports = CodBlocklist;

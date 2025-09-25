const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Collection = sequelize.define('Collection', {
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
	imageUrl: {
		type: DataTypes.STRING(500),
		allowNull: true
	},
	isActive: {
		type: DataTypes.BOOLEAN,
		defaultValue: true
	},
	sortOrder: {
		type: DataTypes.INTEGER,
		defaultValue: 0
	},
	collectionType: {
		type: DataTypes.ENUM('manual', 'automatic', 'smart'),
		defaultValue: 'manual'
	},
	conditions: {
		type: DataTypes.JSON,
		allowNull: true,
		comment: 'JSON object defining automatic collection conditions'
	}
}, {
	timestamps: true,
	indexes: [
		{ unique: true, fields: ['slug'] },
		{ fields: ['name'] },
		{ fields: ['isActive'] },
		{ fields: ['sortOrder'] },
		{ fields: ['collectionType'] }
	]
});

module.exports = Collection;

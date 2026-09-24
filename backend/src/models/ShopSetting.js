const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShopSetting = sequelize.define('ShopSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    defaultValue: 1,
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
}, {
  timestamps: true,
});

module.exports = ShopSetting;

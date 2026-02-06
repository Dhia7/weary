const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cart = sequelize.define('Cart', {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1 }
  },
  size: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Selected size for the product (e.g., S, M, L)'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['productId'] }
    // Note: Unique constraint with size will be added via migration script
    // to avoid errors if column doesn't exist yet
  ]
});

module.exports = Cart;

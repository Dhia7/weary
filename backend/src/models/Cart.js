const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cart = sequelize.define('Cart', {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1 }
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['productId'] },
    { 
      fields: ['userId', 'productId'],
      unique: true,
      name: 'unique_user_product_cart'
    }
  ]
});

module.exports = Cart;

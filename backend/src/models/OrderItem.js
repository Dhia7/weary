const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Order = require('./Order');
const Product = require('./Product');

const OrderItem = sequelize.define('OrderItem', {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  unitPriceCents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0 }
  }
}, {
  timestamps: false,
  indexes: [
    { fields: ['productId'] },
    { fields: ['orderId'] }
  ]
});

Order.hasMany(OrderItem, { as: 'items', foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { as: 'orderItems', foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

module.exports = OrderItem;



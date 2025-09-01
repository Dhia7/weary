const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Order = sequelize.define('Order', {
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  totalAmountCents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  shippingAddress: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  notes: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['createdAt'] },
  ]
});

User.hasMany(Order, { as: 'orders', foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

module.exports = Order;



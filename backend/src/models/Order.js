const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'paid', 'shipped', 'delivered', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  customerType: {
    type: DataTypes.ENUM('registered', 'guest'),
    allowNull: false,
    defaultValue: 'guest'
  },
  customerInfo: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Customer information for both registered and guest users'
  },
  totalAmountCents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 }
  },
  shippingCostCents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'TND'
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  shippingAddress: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  billingInfo: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  notes: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  cancelReason: {
    type: DataTypes.STRING(80),
    allowNull: true,
    comment: 'refused_at_delivery | unreachable | admin_rejected | timeout | outbid | other'
  },
  verificationExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Pending orders auto-cancel after this time if not phone-confirmed'
  },
  stockLocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'True after stock was atomically reserved on delivered (door acceptance)'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['customerType'] },
    { fields: ['createdAt'] },
    { fields: ['verificationExpiresAt'] },
    { fields: ['status', 'verificationExpiresAt'] },
  ]
});

module.exports = Order;






const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Address = sequelize.define('Address', {
  type: {
    type: DataTypes.ENUM('home', 'work', 'other'),
    defaultValue: 'home',
    allowNull: false
  },
  street: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  zipCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'United States',
    allowNull: false
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

// Define the relationship
User.hasMany(Address, { as: 'addresses', foreignKey: 'userId' });
Address.belongsTo(User, { foreignKey: 'userId' });

module.exports = Address;

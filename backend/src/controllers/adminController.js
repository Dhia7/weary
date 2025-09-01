const User = require('../models/User');
const Address = require('../models/Address');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
// @access  Admin only
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows: users } = await User.findAndCountAll({
      include: [{
        model: Address,
        as: 'addresses',
        attributes: ['id', 'type', 'city', 'state', 'country', 'isDefault']
      }],
      attributes: [
        'id', 'email', 'firstName', 'lastName', 'phone', 
        'isEmailVerified', 'isActive', 'twoFactorEnabled', 'isAdmin',
        'lastLogin', 'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: count,
          usersPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get user by ID with full details
// @route   GET /api/admin/users/:id
// @access  Admin only
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      include: [{
        model: Address,
        as: 'addresses'
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          phone: user.phone,
          isEmailVerified: user.isEmailVerified,
          isAdmin: user.isAdmin,
          isActive: user.isActive,
          twoFactorEnabled: user.twoFactorEnabled,
          preferences: user.preferences,
          addresses: user.addresses || [],
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update user (admin can update any user)
// @route   PUT /api/admin/users/:id
// @access  Admin only
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, isActive, isEmailVerified, preferences } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (isEmailVerified !== undefined) user.isEmailVerified = isEmailVerified;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.getFullName(),
          phone: user.phone,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin only
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete associated addresses first
    await Address.destroy({ where: { userId: id } });
    
    // Delete user
    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get user addresses
// @route   GET /api/admin/users/:id/addresses
// @access  Admin only
const getUserAddresses = async (req, res) => {
  try {
    const { id } = req.params;
    
    const addresses = await Address.findAll({
      where: { userId: id },
      order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        addresses,
        totalAddresses: addresses.length
      }
    });
  } catch (error) {
    console.error('Get user addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Add address for user
// @route   POST /api/admin/users/:id/addresses
// @access  Admin only
const addUserAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, street, city, state, zipCode, country, isDefault } = req.body;
    
    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: id } }
      );
    }

    const address = await Address.create({
      userId: id,
      type,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { address }
    });
  } catch (error) {
    console.error('Add user address error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update user address
// @route   PUT /api/admin/users/:id/addresses/:addressId
// @access  Admin only
const updateUserAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;
    const { type, street, city, state, zipCode, country, isDefault } = req.body;
    
    const address = await Address.findOne({
      where: { id: addressId, userId: id }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: id, id: { [Op.ne]: addressId } } }
      );
    }

    // Update address
    if (type) address.type = type;
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (zipCode) address.zipCode = zipCode;
    if (country) address.country = country;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await address.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: { address }
    });
  } catch (error) {
    console.error('Update user address error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Delete user address
// @route   DELETE /api/admin/users/:id/addresses/:addressId
// @access  Admin only
const deleteUserAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;
    
    const address = await Address.findOne({
      where: { id: addressId, userId: id }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await address.destroy();

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete user address error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Admin only
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const verifiedUsers = await User.count({ where: { isEmailVerified: true } });
    const usersWithAddresses = await User.count({
      include: [{
        model: Address,
        as: 'addresses',
        required: true
      }]
    });

    // Recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Users by country (top 5)
    const usersByCountry = await Address.findAll({
      attributes: [
        'country',
        [sequelize.fn('COUNT', sequelize.col('userId')), 'userCount']
      ],
      group: ['country'],
      order: [[sequelize.fn('COUNT', sequelize.col('userId')), 'DESC']],
      limit: 5
    });

    // Product stats
    const totalProducts = await Product.count();
    const activeProducts = await Product.count({ where: { isActive: true } });

    // Order stats
    const totalOrders = await Order.count();
    const ordersByStatus = await Order.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status']
    });

    const revenueLast30DaysRow = await Order.findOne({
      attributes: [[sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('totalAmountCents')), 0), 'revenueCents']],
      where: { createdAt: { [Op.gte]: thirtyDaysAgo }, status: { [Op.in]: ['paid', 'shipped', 'delivered'] } },
      raw: true
    });
    const revenueLast30Days = parseInt(revenueLast30DaysRow?.revenueCents || 0, 10);

    // Top products by quantity in last 30 days
    const topProducts = await OrderItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold']
      ],
      include: [{ model: Product, attributes: ['id', 'name', 'slug', 'SKU'] }],
      group: ['productId', 'Product.id'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 5,
      where: sequelize.where(
        sequelize.col('OrderItem.orderId'),
        'IN',
        sequelize.literal(`(SELECT id FROM "Orders" WHERE "createdAt" >= '${thirtyDaysAgo.toISOString()}')`)
      )
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        usersWithAddresses,
        recentUsers,
        usersByCountry,
        totalProducts,
        activeProducts,
        totalOrders,
        ordersByStatus,
        revenueLast30Days,
        topProducts
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Search users
// @route   GET /api/admin/users/search
// @access  Admin only
const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: {
        [Op.or]: [
          { email: { [Op.iLike]: `%${q}%` } },
          { firstName: { [Op.iLike]: `%${q}%` } },
          { lastName: { [Op.iLike]: `%${q}%` } },
          { phone: { [Op.iLike]: `%${q}%` } }
        ]
      },
      include: [{
        model: Address,
        as: 'addresses',
        attributes: ['id', 'type', 'city', 'state', 'country', 'isDefault']
      }],
      attributes: [
        'id', 'email', 'firstName', 'lastName', 'phone', 
        'isEmailVerified', 'isActive', 'twoFactorEnabled',
        'lastLogin', 'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: count,
          usersPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    List all admin users
// @route   GET /api/admin/admins
// @access  Admin only
const listAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { isAdmin: true },
      attributes: ['id', 'email', 'firstName', 'lastName', 'isActive', 'createdAt']
    });

    res.json({
      success: true,
      data: { admins }
    });
  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// @desc    Request admin privileges (for first admin user)
// @route   PUT /api/admin/users/:id/request-admin
// @access  Authenticated users only
const requestAdminPrivileges = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only allow users to request admin for themselves
    if (req.userData.id !== parseInt(id, 10)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only request admin privileges for yourself' 
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // For development: Allow any user to become admin
    // In production, you'd want to add proper approval logic here
    user.isAdmin = true;
    await user.save();
    
    res.json({
      success: true,
      message: 'Admin privileges granted',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin
        }
      }
    });
  } catch (error) {
    console.error('Request admin privileges error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// @desc    Set a user's admin status
// @route   PUT /api/admin/users/:id/admin
// @access  Admin only
const setUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isAdmin must be a boolean' });
    }

    // Prevent self-demotion to avoid locking out all admins (optional safety)
    if (req.userData && req.userData.id === parseInt(id, 10) && isAdmin === false) {
      return res.status(400).json({ success: false, message: 'You cannot remove your own admin access' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isAdmin = isAdmin;
    await user.save();

    res.json({
      success: true,
      message: 'Admin status updated',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    console.error('Set user admin error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
 };

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getDashboardStats,
  searchUsers,
  listAdmins,
  setUserAdmin,
  requestAdminPrivileges
};

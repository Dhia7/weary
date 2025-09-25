const User = require('../models/User');
const Address = require('../models/Address');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
// @access  Admin only
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build where clause based on filters
    const whereClause = {};
    
    // Filter by admin status
    if (req.query.filter === 'admin') {
      whereClause.isAdmin = true;
    }
    
    // Filter by verification status
    if (req.query.filter === 'verified') {
      whereClause.isEmailVerified = true;
    }
    
    if (req.query.filter === 'unverified') {
      whereClause.isEmailVerified = false;
    }
    
    // Filter by active status
    if (req.query.filter === 'active') {
      whereClause.isActive = true;
    }
    
    if (req.query.filter === 'inactive') {
      whereClause.isActive = false;
    }
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
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
        },
        filter: req.query.filter || 'all'
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
    const { firstName, lastName, phone, isActive, isEmailVerified, isAdmin, preferences } = req.body;
    
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
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
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
          isAdmin: user.isAdmin,
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

    // Get product statistics
    const totalProducts = await Product.count();
    const activeProducts = await Product.count({ where: { isActive: true } });

    // Get order statistics
    const totalOrders = await Order.count();
    
    // Orders by status
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    // Revenue calculation (last 30 days)
    // Using the same thirtyDaysAgo variable from above
    
    const revenueResult = await Order.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalAmountCents')), 'totalRevenue']
      ],
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        },
        status: {
          [Op.in]: ['paid', 'delivered']
        }
      }
    });
    
    const revenueLast30Days = revenueResult ? parseInt(revenueResult.dataValues.totalRevenue) || 0 : 0;

    // Top products by order count
    const topProducts = await OrderItem.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('OrderItem.id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'totalQuantity']
      ],
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price'],
        required: true
      }],
      group: ['Product.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('OrderItem.id')), 'DESC']],
      limit: 5
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
    const { q, page = 1, limit = 10, filter } = req.query;
    const offset = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build where clause for search and filters
    const whereClause = {
      [Op.or]: [
        { email: { [Op.iLike]: `%${q}%` } },
        { firstName: { [Op.iLike]: `%${q}%` } },
        { lastName: { [Op.iLike]: `%${q}%` } },
        { phone: { [Op.iLike]: `%${q}%` } }
      ]
    };

    // Add filter conditions
    if (filter === 'admin') {
      whereClause.isAdmin = true;
    }
    
    if (filter === 'verified') {
      whereClause.isEmailVerified = true;
    }
    
    if (filter === 'unverified') {
      whereClause.isEmailVerified = false;
    }
    
    if (filter === 'active') {
      whereClause.isActive = true;
    }
    
    if (filter === 'inactive') {
      whereClause.isActive = false;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: Address,
        as: 'addresses',
        attributes: ['id', 'type', 'city', 'state', 'country', 'isDefault']
      }],
      attributes: [
        'id', 'email', 'firstName', 'lastName', 'phone', 
        'isEmailVerified', 'isActive', 'twoFactorEnabled', 'isAdmin',
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
        },
        filter: filter || 'all'
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

// @desc    Toggle admin status for a user
// @route   PUT /api/admin/users/:id/admin
// @access  Admin only
const toggleUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update admin status
    user.isAdmin = isAdmin;
    await user.save();

    res.json({
      success: true,
      message: `User ${isAdmin ? 'granted' : 'removed'} admin privileges successfully`,
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
    console.error('Toggle user admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Request admin privileges (for self-promotion)
// @route   PUT /api/admin/users/:id/request-admin
// @access  Authenticated user (can request for themselves)
const requestAdminPrivileges = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.id;
    
    // Users can only request admin privileges for themselves
    if (id !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only request admin privileges for yourself'
      });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For now, we'll grant admin privileges directly
    // In a real application, this might require approval from other admins
    user.isAdmin = true;
    await user.save();

    res.json({
      success: true,
      message: 'Admin privileges granted successfully',
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
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
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
  toggleUserAdmin,
  requestAdminPrivileges
};

const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../config/database');

// Import associations first to set up relationships
require('../models/associations');

// Then import models from associations
const { User, Product, Order, OrderItem } = require('../models/associations');

// List orders with pagination and filters
const listOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { status, q } = req.query;

    const where = {};
    if (status) where.status = status;

    const include = [
      { model: User, as: 'User', attributes: ['id', 'email', 'firstName', 'lastName'], required: false },
      { model: OrderItem, as: 'items', include: [{ model: Product, as: 'Product', attributes: ['id', 'name', 'slug', 'SKU', 'description', 'price', 'compareAtPrice', 'imageUrl', 'images', 'mainThumbnailIndex', 'quantity', 'weightGrams', 'barcode', 'isActive'] }] }
    ];

    if (q) {
      console.log('Search query received:', q);
      const searchTerm = q.trim();
      
      // Enhanced search for both registered and guest orders
      where[Op.or] = [
        // Registered users with matching user data
        sequelize.and(
          { customerType: 'registered' },
          { userId: { [Op.ne]: null } },
          sequelize.or(
            // Search in User table through association
            sequelize.literal(`EXISTS (
              SELECT 1 FROM "User" 
              WHERE "User"."id" = "Order"."userId" 
              AND (
                "User"."email" ILIKE '%${searchTerm}%' 
                OR "User"."firstName" ILIKE '%${searchTerm}%' 
                OR "User"."lastName" ILIKE '%${searchTerm}%'
              )
            )`)
          )
        ),
        // Guest orders with matching billing info (JSONB search)
        sequelize.and(
          { customerType: 'guest' },
          sequelize.or(
            // Search individual fields
            sequelize.where(sequelize.fn('jsonb_extract_path_text', sequelize.col('billingInfo'), 'firstName'), { [Op.iLike]: `%${searchTerm}%` }),
            sequelize.where(sequelize.fn('jsonb_extract_path_text', sequelize.col('billingInfo'), 'lastName'), { [Op.iLike]: `%${searchTerm}%` }),
            sequelize.where(sequelize.fn('jsonb_extract_path_text', sequelize.col('billingInfo'), 'email'), { [Op.iLike]: `%${searchTerm}%` }),
            sequelize.where(sequelize.fn('jsonb_extract_path_text', sequelize.col('billingInfo'), 'phone'), { [Op.iLike]: `%${searchTerm}%` }),
            // Search full name combination (e.g., "Jane Smith" matches firstName + lastName)
            sequelize.where(
              sequelize.fn('concat', 
                sequelize.fn('jsonb_extract_path_text', sequelize.col('billingInfo'), 'firstName'),
                ' ',
                sequelize.fn('jsonb_extract_path_text', sequelize.col('billingInfo'), 'lastName')
              ), 
              { [Op.iLike]: `%${searchTerm}%` }
            )
          )
        ),
        // Guest orders with matching customer info (JSONB search)
        sequelize.and(
          { customerType: 'guest' },
          sequelize.or(
            // Search individual fields
            sequelize.where(sequelize.fn('jsonb_extract_path_text', sequelize.col('customerInfo'), 'firstName'), { [Op.iLike]: `%${searchTerm}%` }),
            sequelize.where(sequelize.fn('jsonb_extract_path_text', sequelize.col('customerInfo'), 'lastName'), { [Op.iLike]: `%${searchTerm}%` }),
            sequelize.where(sequelize.fn('jsonb_extract_path_text', sequelize.col('customerInfo'), 'email'), { [Op.iLike]: `%${searchTerm}%` }),
            sequelize.where(sequelize.fn('jsonb_extract_path_text', sequelize.col('customerInfo'), 'phone'), { [Op.iLike]: `%${searchTerm}%` }),
            // Search full name combination
            sequelize.where(
              sequelize.fn('concat', 
                sequelize.fn('jsonb_extract_path_text', sequelize.col('customerInfo'), 'firstName'),
                ' ',
                sequelize.fn('jsonb_extract_path_text', sequelize.col('customerInfo'), 'lastName')
              ), 
              { [Op.iLike]: `%${searchTerm}%` }
            )
          )
        )
      ];
    }

    // Use findAll instead of findAndCountAll to avoid issues with includes
    const rows = await Order.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    // Get count separately
    const count = await Order.count({ where });
    
    // Transform orders to include user data for registered orders
    const ordersWithUsers = await Promise.all(rows.map(async (order) => {
      const orderData = order.toJSON();
      
      if (orderData.customerType === 'registered' && orderData.userId && !orderData.user) {
        try {
          const user = await User.findByPk(orderData.userId, {
            attributes: ['id', 'email', 'firstName', 'lastName']
          });
          if (user) {
            orderData.user = user.toJSON();
          }
        } catch (error) {
          console.error('Error fetching user for order', orderData.id, ':', error.message);
        }
      }
      
      return orderData;
    }));

    const totalPages = Math.ceil(count / limit);
    res.json({ success: true, data: { orders: ordersWithUsers, pagination: { currentPage: page, totalPages, totalOrders: count, perPage: limit } } });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get order by id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'firstName', 'lastName'], required: false },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'Product', attributes: ['id', 'name', 'slug', 'SKU', 'description', 'price', 'compareAtPrice', 'imageUrl', 'images', 'mainThumbnailIndex', 'quantity', 'weightGrams', 'barcode', 'isActive'] }] }
      ]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Transform order to include user data if needed
    const orderData = order.toJSON();
    if (orderData.customerType === 'registered' && orderData.userId && !orderData.user) {
      try {
        const user = await User.findByPk(orderData.userId, {
          attributes: ['id', 'email', 'firstName', 'lastName']
        });
        if (user) {
          orderData.user = user.toJSON();
        }
      } catch (error) {
        console.error('Error fetching user for order', orderData.id, ':', error.message);
      }
    }
    
    res.json({ success: true, data: { order: orderData } });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create order (admin)
const createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { userId, items, currency = 'USD', paymentMethod, shippingAddress, billingInfo, shippingCostCents = 0, notes } = req.body;
    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'userId and at least one item are required' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Validate products exist, check stock availability, and compute total
    let merchandiseTotalCents = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || item.unitPriceCents == null) {
        return res.status(400).json({ success: false, message: 'Each item requires productId, quantity, unitPriceCents' });
      }
      const product = await Product.findByPk(item.productId);
      if (!product) return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      
      // Check stock availability
      if (item.quantity > product.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Only ${product.quantity} items available, but ${item.quantity} requested.` 
        });
      }
      
      merchandiseTotalCents += item.quantity * item.unitPriceCents;
    }
    const totalAmountCents = merchandiseTotalCents + (Number.isFinite(shippingCostCents) ? shippingCostCents : 0);

    // Prepare customer information for registered user
    const customerInfo = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || null
    };

    const order = await Order.create({ 
      userId, 
      customerType: 'registered',
      customerInfo,
      status: 'pending', 
      totalAmountCents, 
      shippingCostCents, 
      currency, 
      paymentMethod, 
      shippingAddress, 
      billingInfo, 
      notes 
    }, { transaction: t });

    for (const item of items) {
      await OrderItem.create({ orderId: order.id, productId: item.productId, quantity: item.quantity, unitPriceCents: item.unitPriceCents }, { transaction: t });
    }

    await t.commit();

    const created = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'firstName', 'lastName'], required: false },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'Product', attributes: ['id', 'name', 'slug', 'SKU', 'description', 'price', 'compareAtPrice', 'imageUrl', 'images', 'mainThumbnailIndex', 'quantity', 'weightGrams', 'barcode', 'isActive'] }] }
      ]
    });
    res.status(201).json({ success: true, data: { order: created } });
  } catch (error) {
    await t.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create order for authenticated user
const createUserOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.userId; // From auth middleware (JWT token)
    const { items, currency = 'USD', paymentMethod, shippingAddress, billingInfo, shippingCostCents = 0, notes } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Validate products exist, check stock availability, and compute total
    let merchandiseTotalCents = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || item.unitPriceCents == null) {
        return res.status(400).json({ success: false, message: 'Each item requires productId, quantity, unitPriceCents' });
      }
      const product = await Product.findByPk(item.productId);
      if (!product) return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      
      // Check stock availability
      if (item.quantity > product.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Only ${product.quantity} items available, but ${item.quantity} requested.` 
        });
      }
      
      merchandiseTotalCents += item.quantity * item.unitPriceCents;
    }
    const totalAmountCents = merchandiseTotalCents + (Number.isFinite(shippingCostCents) ? shippingCostCents : 0);

    // Prepare customer information for registered user
    const customerInfo = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || null
    };

    const order = await Order.create({ 
      userId, 
      customerType: 'registered',
      customerInfo,
      status: 'pending', 
      totalAmountCents, 
      shippingCostCents, 
      currency, 
      paymentMethod, 
      shippingAddress, 
      billingInfo, 
      notes 
    }, { transaction: t });

    for (const item of items) {
      await OrderItem.create({ orderId: order.id, productId: item.productId, quantity: item.quantity, unitPriceCents: item.unitPriceCents }, { transaction: t });
    }

    await t.commit();

    const created = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'firstName', 'lastName'], required: false },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'Product', attributes: ['id', 'name', 'slug', 'SKU', 'description', 'price', 'compareAtPrice', 'imageUrl', 'images', 'mainThumbnailIndex', 'quantity', 'weightGrams', 'barcode', 'isActive'] }] }
      ]
    });
    res.status(201).json({ success: true, data: { order: created } });
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error('Create user order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create guest order (no authentication required)
const createGuestOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, currency = 'USD', paymentMethod, shippingAddress, billingInfo, shippingCostCents = 0, notes } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    // Validate billing info for guest orders
    if (!billingInfo || !billingInfo.email || !billingInfo.firstName || !billingInfo.lastName) {
      return res.status(400).json({ success: false, message: 'Billing information (email, firstName, lastName) is required for guest orders' });
    }

    // Validate products exist, check stock availability, and compute total
    let merchandiseTotalCents = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || item.unitPriceCents == null) {
        return res.status(400).json({ success: false, message: 'Each item requires productId, quantity, unitPriceCents' });
      }
      const product = await Product.findByPk(item.productId);
      if (!product) return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      
      // Check stock availability
      if (item.quantity > product.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Only ${product.quantity} items available, but ${item.quantity} requested.` 
        });
      }
      
      merchandiseTotalCents += item.quantity * item.unitPriceCents;
    }
    const totalAmountCents = merchandiseTotalCents + (Number.isFinite(shippingCostCents) ? shippingCostCents : 0);

    // Prepare customer information for guest user
    const customerInfo = {
      email: billingInfo.email,
      firstName: billingInfo.firstName,
      lastName: billingInfo.lastName,
      phone: billingInfo.phone || null
    };

    // Create order without userId (guest order)
    const order = await Order.create({ 
      userId: null, // Guest order
      customerType: 'guest',
      customerInfo,
      status: 'pending', 
      totalAmountCents, 
      shippingCostCents, 
      currency, 
      paymentMethod, 
      shippingAddress, 
      billingInfo, 
      notes
    }, { transaction: t });

    for (const item of items) {
      await OrderItem.create({ orderId: order.id, productId: item.productId, quantity: item.quantity, unitPriceCents: item.unitPriceCents }, { transaction: t });
    }

    await t.commit();

    const created = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'firstName', 'lastName'], required: false },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'Product', attributes: ['id', 'name', 'slug', 'SKU', 'description', 'price', 'compareAtPrice', 'imageUrl', 'images', 'mainThumbnailIndex', 'quantity', 'weightGrams', 'barcode', 'isActive'] }] }
      ]
    });
    res.status(201).json({ success: true, data: { order: created } });
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error('Create guest order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update order status (admin)
const updateOrderStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'processing', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    
    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const previousStatus = order.status;
    order.status = status;
    await order.save({ transaction: t });
    
    // If order is being marked as paid or delivered, reduce stock
    if ((status === 'paid' || status === 'delivered') && 
        previousStatus !== 'paid' && previousStatus !== 'delivered') {
      for (const item of order.items) {
        const product = await Product.findByPk(item.productId, { transaction: t });
        if (product) {
          // Ensure stock doesn't go below 0
          const newQuantity = Math.max(0, product.quantity - item.quantity);
          product.quantity = newQuantity;
          await product.save({ transaction: t });
          
          console.log(`Stock reduced for product ${product.name}: ${item.quantity} units (new stock: ${newQuantity})`);
        }
      }
    }
    
    // If order is being cancelled and was previously paid or delivered, restore stock
    if (status === 'cancelled' && (previousStatus === 'paid' || previousStatus === 'delivered')) {
      for (const item of order.items) {
        const product = await Product.findByPk(item.productId, { transaction: t });
        if (product) {
          product.quantity += item.quantity;
          await product.save({ transaction: t });
          
          console.log(`Stock restored for product ${product.name}: ${item.quantity} units (new stock: ${product.quantity})`);
        }
      }
    }
    
    await t.commit();
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    await t.rollback();
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete order (admin)
const deleteOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    await OrderItem.destroy({ where: { orderId: id }, transaction: t });
    await order.destroy({ transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    await t.rollback();
    console.error('Delete order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  createUserOrder,
  createGuestOrder,
  updateOrderStatus,
  deleteOrder
};






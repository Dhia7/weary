const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

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
      { model: User, attributes: ['id', 'email', 'firstName', 'lastName'] },
      { model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'slug', 'SKU'] }] }
    ];

    if (q) {
      include[0].where = {
        [Op.or]: [
          { email: { [Op.iLike]: `%${q}%` } },
          { firstName: { [Op.iLike]: `%${q}%` } },
          { lastName: { [Op.iLike]: `%${q}%` } }
        ]
      };
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);
    res.json({ success: true, data: { orders: rows, pagination: { currentPage: page, totalPages, totalOrders: count, perPage: limit } } });
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
        { model: User, attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'slug', 'SKU'] }] }
      ]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: { order } });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create order (admin)
const createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { userId, items, currency = 'USD', paymentMethod, shippingAddress, notes } = req.body;
    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'userId and at least one item are required' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Validate products exist and compute total
    let totalAmountCents = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || item.unitPriceCents == null) {
        return res.status(400).json({ success: false, message: 'Each item requires productId, quantity, unitPriceCents' });
      }
      const product = await Product.findByPk(item.productId);
      if (!product) return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      totalAmountCents += item.quantity * item.unitPriceCents;
    }

    const order = await Order.create({ userId, status: 'pending', totalAmountCents, currency, paymentMethod, shippingAddress, notes }, { transaction: t });

    for (const item of items) {
      await OrderItem.create({ orderId: order.id, productId: item.productId, quantity: item.quantity, unitPriceCents: item.unitPriceCents }, { transaction: t });
    }

    await t.commit();

    const created = await Order.findByPk(order.id, {
      include: [
        { model: User, attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'slug', 'SKU'] }] }
      ]
    });
    res.status(201).json({ success: true, data: { order: created } });
  } catch (error) {
    await t.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update order status (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    await order.save();
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
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
  updateOrderStatus,
  deleteOrder
};



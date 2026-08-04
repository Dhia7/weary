const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Import associations first to set up relationships
require('../models/associations');

// Then import models from associations
const { User, Product, ProductVariant, Order, OrderItem } = require('../models/associations');

const {
	checkItemStockAvailability,
	reduceItemStock,
	restoreItemStock,
	isStockLockedStatus
} = require('../utils/stockHelpers');
const { verifyAdminPassword } = require('../utils/adminAuth');
const { normalizeSearchQuery } = require('../utils/searchQuery');
const {
	hasMailTransport,
	sendOrderConfirmationEmail,
	sendOrderAdminNotificationEmail,
	sendPersonalizedOrderEmails,
	sendOrderCancelledEmail,
	sendTransactional,
} = require('../utils/mail');
const {
	normalizePhone,
	CANCEL_REASONS,
	defaultVerificationExpiresAt
} = require('../utils/orderSecurity');
const { isCodBlocked, blockCodContacts } = require('../utils/codBlocklist');
const { notifyWaitlistForOrderItems } = require('../utils/waitlistNotify');

const notifyOrderEmails = (order) => {
	if (!hasMailTransport() || !order) return;
	sendTransactional(sendOrderConfirmationEmail(order), 'order-confirmation');
	sendTransactional(sendOrderAdminNotificationEmail(order), 'order-admin');
};

const formatStockErrorMessage = (product, item) => {
	const parts = [];
	if (item.color) parts.push(`Color: ${item.color}`);
	if (item.size) parts.push(`Size: ${item.size}`);
	const suffix = parts.length ? ` (${parts.join(', ')})` : '';
	return `Sorry, we don't have enough ${product.name}${suffix} in stock to fulfill your order. Please reduce the quantity or contact us for availability.`;
};

const requireLandmark = (shippingAddress) => {
	const landmark = shippingAddress?.landmark?.trim?.() || shippingAddress?.landmark;
	if (!landmark || String(landmark).trim().length < 3) {
		return 'A delivery landmark (nearby café, school, or known place) is required for cash on delivery.';
	}
	return null;
};

const assertCheckoutAllowed = async ({ phone, email, items, transaction }) => {
	const blocked = await isCodBlocked({ phone, email });
	if (blocked) {
		return {
			ok: false,
			status: 403,
			message: 'Cash on delivery is not available for this phone or email. Please contact us for help.'
		};
	}

	const normalizedPhone = normalizePhone(phone);
	if (!normalizedPhone) {
		return { ok: false, status: 400, message: 'A valid phone number is required for cash on delivery.' };
	}

	const scarceItems = [];
	for (const item of items) {
		const product = await Product.findByPk(item.productId, {
			transaction,
			attributes: { exclude: ['sizeStock'] }
		});
		if (!product) {
			return { ok: false, status: 400, message: `Product ${item.productId} not found` };
		}
		const stockCheck = await checkItemStockAvailability(product, item, item.quantity);
		if (!stockCheck.available) {
			return { ok: false, status: 400, message: formatStockErrorMessage(product, item) };
		}
		const isScarce = stockCheck.stock <= item.quantity && stockCheck.stock < 999;
		if (isScarce) {
			scarceItems.push({
				productId: item.productId,
				variantId: item.variantId || null,
				qty: item.quantity,
				stock: stockCheck.stock,
			});
		}
	}

	if (scarceItems.length > 0 && normalizedPhone) {
		const pendingOrders = await Order.findAll({
			where: { status: 'pending' },
			include: [{ model: OrderItem, as: 'items', required: true }],
			transaction
		});

		const conflictingOrders = [];
		const seen = new Set();
		for (const order of pendingOrders) {
			const orderPhone = normalizePhone(
				order.customerInfo?.phone || order.billingInfo?.phone
			);
			if (orderPhone !== normalizedPhone) continue;

			let orderConflicts = false;
			for (const pendingItem of order.items || []) {
				for (const scarce of scarceItems) {
					if (Number(pendingItem.productId) !== Number(scarce.productId)) continue;
					const pendingVariant =
						pendingItem.variantId != null ? Number(pendingItem.variantId) : null;
					const scarceVariant =
						scarce.variantId != null ? Number(scarce.variantId) : null;
					const variantOk =
						pendingVariant == null ||
						scarceVariant == null ||
						pendingVariant === scarceVariant;
					if (!variantOk) continue;
					orderConflicts = true;
					const key = `${order.id}:${scarce.productId}:${scarceVariant ?? ''}`;
					if (seen.has(key)) continue;
					seen.add(key);
				}
			}
			if (orderConflicts) conflictingOrders.push(order);
		}

		// Same scarce SKU already pending: replace old pending (latest checkout wins)
		for (const order of conflictingOrders) {
			order.status = 'cancelled';
			order.cancelReason = 'replaced';
			await order.save({ transaction });
		}
	}

	return { ok: true };
};

const lockStockForOrder = async (order, transaction) => {
	for (const item of order.items) {
		const product = await Product.findByPk(item.productId, {
			transaction,
			attributes: { exclude: ['sizeStock'] }
		});
		if (!product) {
			const err = new Error(`Product ${item.productId} not found`);
			err.code = 'PRODUCT_NOT_FOUND';
			throw err;
		}
		await reduceItemStock(product, item, item.quantity, transaction);
		const opts = [item.color, item.size].filter(Boolean).join(', ');
		console.log(`Stock locked for ${product.name}${opts ? ` (${opts})` : ''}: ${item.quantity}`);
	}
	order.stockLocked = true;
	await order.save({ transaction });
};

const unlockStockForOrder = async (order, transaction) => {
	if (!order.stockLocked) return;
	for (const item of order.items) {
		const product = await Product.findByPk(item.productId, {
			transaction,
			attributes: { exclude: ['sizeStock'] }
		});
		if (product) {
			await restoreItemStock(product, item, item.quantity, transaction);
			const opts = [item.color, item.size].filter(Boolean).join(', ');
			console.log(`Stock restored for ${product.name}${opts ? ` (${opts})` : ''}: ${item.quantity}`);
		}
	}
	order.stockLocked = false;
	await order.save({ transaction });
};

const itemsConflict = (a, b) => {
	if (a.productId !== b.productId) return false;
	if (a.variantId && b.variantId) return Number(a.variantId) === Number(b.variantId);
	if (a.variantId || b.variantId) return Number(a.variantId || 0) === Number(b.variantId || 0);
	return (a.size || null) === (b.size || null) && (a.color || null) === (b.color || null);
};

const cancelConflictingPendingOrders = async (confirmedOrder, transaction) => {
	const confirmedItems = confirmedOrder.items || [];
	if (confirmedItems.length === 0) return [];

	const pending = await Order.findAll({
		where: {
			status: 'pending',
			id: { [Op.ne]: confirmedOrder.id }
		},
		include: [{ model: OrderItem, as: 'items', required: true }],
		transaction
	});

	const cancelled = [];
	for (const other of pending) {
		const conflicts = (other.items || []).some((oi) =>
			confirmedItems.some((ci) => itemsConflict(ci, oi))
		);
		if (!conflicts) continue;
		other.status = 'cancelled';
		other.cancelReason = 'outbid';
		await other.save({ transaction });
		cancelled.push(other);
	}
	return cancelled;
};

const toCents = (value) => {
	if (value == null || value === '') return null;
	const n = parseFloat(value);
	if (!Number.isFinite(n) || n < 0) return null;
	return Math.round(n * 100);
};

/** Resolve buy cost from variant override, else product cost. */
const resolveUnitCostCents = async (item, product, transaction) => {
	if (item.variantId) {
		const variant = await ProductVariant.findByPk(item.variantId, { transaction });
		const variantCost = toCents(variant?.costPrice);
		if (variantCost != null) return variantCost;
	}
	const productCost = toCents(product?.costPrice);
	return productCost != null ? productCost : 0;
};

const createOrderItemRecord = async (orderId, item, transaction) => {
	const product = await Product.findByPk(item.productId, {
		transaction,
		attributes: ['id', 'costPrice']
	});
	const unitCostCents = await resolveUnitCostCents(item, product, transaction);
	return OrderItem.create({
		orderId,
		productId: item.productId,
		quantity: item.quantity,
		unitPriceCents: item.unitPriceCents,
		unitCostCents,
		size: item.size || null,
		color: item.color || null,
		variantId: item.variantId || null
	}, { transaction });
};

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
      const normalized = normalizeSearchQuery(q);
      if (!normalized.ok) {
        return res.status(400).json({ success: false, message: normalized.message });
      }
      const searchTerm = normalized.term;
      if (searchTerm) {
        const searchConditions = [
          // Search by order ID (full or partial UUID)
          sequelize.where(
            sequelize.cast(sequelize.col('id'), 'TEXT'),
            { [Op.iLike]: `%${searchTerm}%` }
          ),
          // Registered users with matching user data (parameterized via association fields)
          sequelize.and(
            { customerType: 'registered' },
            { userId: { [Op.ne]: null } },
            sequelize.or(
              { '$User.email$': { [Op.iLike]: `%${searchTerm}%` } },
              { '$User.firstName$': { [Op.iLike]: `%${searchTerm}%` } },
              { '$User.lastName$': { [Op.iLike]: `%${searchTerm}%` } }
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

        if (/^\d+$/.test(searchTerm)) {
          searchConditions.push({ userId: Number(searchTerm) });
        }

        where[Op.or] = searchConditions;
      }
    }

    // Use findAll instead of findAndCountAll to avoid issues with includes
    const rows = await Order.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      subQuery: false,
    });
    
    // Count separately; join User only when search filters reference $User.*
    const countOptions = { where };
    if (where[Op.or]) {
      countOptions.include = [{ model: User, as: 'User', attributes: [], required: false }];
      countOptions.distinct = true;
      countOptions.col = 'id';
    }
    const count = await Order.count(countOptions);
    
    // Transform orders to include user data for registered orders
    const ordersWithUsers = await Promise.all(rows.map(async (order) => {
      const orderData = order.toJSON();

      if (orderData.User && !orderData.user) {
        orderData.user = orderData.User;
      }
      
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

// Get orders for authenticated user
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware (JWT token)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const where = { userId }; // Only get orders for this user
    if (status) where.status = status;

    const include = [
      { model: OrderItem, as: 'items', include: [{ model: Product, as: 'Product', attributes: ['id', 'name', 'slug', 'SKU', 'description', 'price', 'compareAtPrice', 'imageUrl', 'images', 'mainThumbnailIndex', 'quantity', 'weightGrams', 'barcode', 'isActive'] }] }
    ];

    const { count, rows } = await Order.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const orders = rows.map(order => order.toJSON());
    const totalPages = Math.ceil(count / limit);
    
    res.json({ 
      success: true, 
      data: { 
        orders, 
        pagination: { 
          currentPage: page, 
          totalPages, 
          totalOrders: count, 
          perPage: limit 
        } 
      } 
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get order by id for authenticated user (checks ownership)
const getUserOrderById = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware (JWT token)
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'Product', attributes: ['id', 'name', 'slug', 'SKU', 'description', 'price', 'compareAtPrice', 'imageUrl', 'images', 'mainThumbnailIndex', 'quantity', 'weightGrams', 'barcode', 'isActive'] }] }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Check if the order belongs to the authenticated user
    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this order' });
    }
    
    const orderData = order.toJSON();
    res.json({ success: true, data: { order: orderData } });
  } catch (error) {
    console.error('Get user order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create order (admin)
const createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { userId, items, currency = 'TND', paymentMethod, shippingAddress, billingInfo, shippingCostCents = 0, notes } = req.body;
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
      const product = await Product.findByPk(item.productId, { 
        transaction: t,
        attributes: { exclude: ['sizeStock'] }
      });
      if (!product) return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      
      const stockCheck = await checkItemStockAvailability(product, item, item.quantity);
      if (!stockCheck.available) {
        return res.status(400).json({ success: false, message: formatStockErrorMessage(product, item) });
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
      notes,
      verificationExpiresAt: defaultVerificationExpiresAt(),
      stockLocked: false
    }, { transaction: t });

    for (const item of items) {
      await createOrderItemRecord(order.id, item, t);
    }

    await t.commit();

    const created = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'firstName', 'lastName'], required: false },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'Product', attributes: ['id', 'name', 'slug', 'SKU', 'description', 'price', 'compareAtPrice', 'imageUrl', 'images', 'mainThumbnailIndex', 'quantity', 'weightGrams', 'barcode', 'isActive'] }] }
      ]
    });
    notifyOrderEmails(created);
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
    const userId = req.user.userId;
    const { items, currency = 'TND', paymentMethod, shippingAddress, billingInfo, shippingCostCents = 0, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    const landmarkError = requireLandmark(shippingAddress);
    if (landmarkError) {
      await t.rollback();
      return res.status(400).json({ success: false, message: landmarkError });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const phone = billingInfo?.phone || user.phone;
    const email = billingInfo?.email || user.email;

    const gate = await assertCheckoutAllowed({ phone, email, items, transaction: t });
    if (!gate.ok) {
      await t.rollback();
      return res.status(gate.status).json({ success: false, message: gate.message });
    }

    let merchandiseTotalCents = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || item.unitPriceCents == null) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Each item requires productId, quantity, unitPriceCents' });
      }
      const product = await Product.findByPk(item.productId, {
        transaction: t,
        attributes: { exclude: ['sizeStock'] }
      });
      if (!product) {
        await t.rollback();
        return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      }

      const stockCheck = await checkItemStockAvailability(product, item, item.quantity);
      if (!stockCheck.available) {
        await t.rollback();
        return res.status(400).json({ success: false, message: formatStockErrorMessage(product, item) });
      }

      merchandiseTotalCents += item.quantity * item.unitPriceCents;
    }
    const totalAmountCents = merchandiseTotalCents + (Number.isFinite(shippingCostCents) ? shippingCostCents : 0);

    const customerInfo = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: phone || null
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
      notes,
      verificationExpiresAt: defaultVerificationExpiresAt(),
      stockLocked: false
    }, { transaction: t });

    for (const item of items) {
      await createOrderItemRecord(order.id, item, t);
    }

    await t.commit();

    const created = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'firstName', 'lastName'], required: false },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'Product', attributes: ['id', 'name', 'slug', 'SKU', 'description', 'price', 'compareAtPrice', 'imageUrl', 'images', 'mainThumbnailIndex', 'quantity', 'weightGrams', 'barcode', 'isActive'] }] }
      ]
    });
    notifyOrderEmails(created);
    res.status(201).json({ success: true, data: { order: created } });
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error('Create user order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createGuestOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, currency = 'TND', paymentMethod, shippingAddress, billingInfo, shippingCostCents = 0, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    const guestFirstName = billingInfo?.firstName?.trim();
    if (!billingInfo || !billingInfo.email?.trim() || !guestFirstName) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Billing information (email and recipient name) is required for guest orders' });
    }

    const landmarkError = requireLandmark(shippingAddress);
    if (landmarkError) {
      await t.rollback();
      return res.status(400).json({ success: false, message: landmarkError });
    }

    const phone = billingInfo?.phone;
    const email = billingInfo?.email;

    const gate = await assertCheckoutAllowed({ phone, email, items, transaction: t });
    if (!gate.ok) {
      await t.rollback();
      return res.status(gate.status).json({ success: false, message: gate.message });
    }

    let merchandiseTotalCents = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || item.unitPriceCents == null) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Each item requires productId, quantity, unitPriceCents' });
      }
      const product = await Product.findByPk(item.productId, {
        transaction: t,
        attributes: { exclude: ['sizeStock'] }
      });
      if (!product) {
        await t.rollback();
        return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      }

      const stockCheck = await checkItemStockAvailability(product, item, item.quantity);
      if (!stockCheck.available) {
        await t.rollback();
        return res.status(400).json({ success: false, message: formatStockErrorMessage(product, item) });
      }

      merchandiseTotalCents += item.quantity * item.unitPriceCents;
    }
    const totalAmountCents = merchandiseTotalCents + (Number.isFinite(shippingCostCents) ? shippingCostCents : 0);

    const customerInfo = {
      email: billingInfo.email,
      firstName: billingInfo.firstName,
      lastName: billingInfo.lastName,
      phone: billingInfo.phone || null
    };

    const order = await Order.create({
      userId: null,
      customerType: 'guest',
      customerInfo,
      status: 'pending',
      totalAmountCents,
      shippingCostCents,
      currency,
      paymentMethod,
      shippingAddress,
      billingInfo,
      notes,
      verificationExpiresAt: defaultVerificationExpiresAt(),
      stockLocked: false
    }, { transaction: t });

    for (const item of items) {
      await createOrderItemRecord(order.id, item, t);
    }

    await t.commit();

    const created = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'firstName', 'lastName'], required: false },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'Product', attributes: ['id', 'name', 'slug', 'SKU', 'description', 'price', 'compareAtPrice', 'imageUrl', 'images', 'mainThumbnailIndex', 'quantity', 'weightGrams', 'barcode', 'isActive'] }] }
      ]
    });
    notifyOrderEmails(created);
    res.status(201).json({ success: true, data: { order: created } });
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error('Create guest order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;
    const allowed = ['pending', 'confirmed', 'processing', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;

    if (status === previousStatus) {
      await t.commit();
      return res.json({ success: true, message: 'Order status unchanged' });
    }

    if (status === 'confirmed' && previousStatus === 'pending') {
      try {
        await lockStockForOrder(order, t);
      } catch (stockErr) {
        await t.rollback();
        if (stockErr.code === 'INSUFFICIENT_STOCK') {
          return res.status(400).json({
            success: false,
            message: 'Item no longer available. Another order may have been confirmed first.'
          });
        }
        throw stockErr;
      }
      order.status = 'confirmed';
      await order.save({ transaction: t });

      const outbid = await cancelConflictingPendingOrders(order, t);
      await t.commit();

      if (hasMailTransport()) {
        for (const cancelled of outbid) {
          sendTransactional(
            sendOrderCancelledEmail(cancelled, 'item reserved by another order'),
            'order-outbid'
          );
        }
      }

      return res.json({
        success: true,
        message: 'Order confirmed — stock locked after phone verification',
        data: { outbidCancelled: outbid.map((o) => o.id) }
      });
    }

    if (status === 'cancelled') {
      const reason = CANCEL_REASONS.includes(cancelReason) ? cancelReason : (cancelReason || 'other');
      const wasLocked = order.stockLocked || isStockLockedStatus(previousStatus);

      if (wasLocked) {
        await unlockStockForOrder(order, t);
      }

      order.status = 'cancelled';
      order.cancelReason = reason;
      await order.save({ transaction: t });

      const itemsSnapshot = (order.items || []).map((i) => ({
        productId: i.productId,
        variantId: i.variantId
      }));

      await t.commit();

      if (reason === 'refused_at_delivery') {
        const phone = order.customerInfo?.phone || order.billingInfo?.phone;
        const email = order.customerInfo?.email || order.billingInfo?.email;
        await blockCodContacts({
          phone,
          email,
          reason: 'refused_at_delivery',
          orderId: order.id
        });
      }

      if (wasLocked || reason === 'refused_at_delivery' || reason === 'outbid') {
        await notifyWaitlistForOrderItems(itemsSnapshot);
      }

      if (hasMailTransport()) {
        sendTransactional(sendOrderCancelledEmail(order, reason), 'order-cancelled');
      }

      return res.json({ success: true, message: 'Order cancelled' });
    }

    if (status === 'confirmed' && previousStatus !== 'pending' && !order.stockLocked) {
      try {
        await lockStockForOrder(order, t);
      } catch (stockErr) {
        await t.rollback();
        if (stockErr.code === 'INSUFFICIENT_STOCK') {
          return res.status(400).json({
            success: false,
            message: 'Item no longer available.'
          });
        }
        throw stockErr;
      }
    }

    // Skipping confirm (e.g. pending → shipped/delivered): still lock stock once
    if (
      previousStatus === 'pending' &&
      ['confirmed', 'processing', 'paid', 'shipped', 'delivered'].includes(status) &&
      !order.stockLocked
    ) {
      try {
        await lockStockForOrder(order, t);
      } catch (stockErr) {
        await t.rollback();
        if (stockErr.code === 'INSUFFICIENT_STOCK') {
          return res.status(400).json({
            success: false,
            message: 'Item no longer available. Another order may have been confirmed first.'
          });
        }
        throw stockErr;
      }
      const outbid = await cancelConflictingPendingOrders(order, t);
      order.status = status;
      await order.save({ transaction: t });
      await t.commit();
      if (hasMailTransport()) {
        for (const cancelled of outbid) {
          sendTransactional(
            sendOrderCancelledEmail(cancelled, 'item reserved by another order'),
            'order-outbid'
          );
        }
      }
      return res.json({ success: true, message: 'Order status updated — stock locked' });
    }

    order.status = status;
    await order.save({ transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// Delete order (admin)
const deleteOrderById = async (orderId, transaction) => {
  const order = await Order.findByPk(orderId, { transaction });
  if (!order) {
    return null;
  }

  await OrderItem.destroy({ where: { orderId }, transaction });
  await order.destroy({ transaction });
  return order;
};

const deleteOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const passwordCheck = await verifyAdminPassword(req);
    if (!passwordCheck.valid) {
      await t.rollback();
      return res.status(passwordCheck.status).json({
        success: false,
        message: passwordCheck.message
      });
    }

    const deletedOrder = await deleteOrderById(id, t);
    if (!deletedOrder) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await t.commit();
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    await t.rollback();
    console.error('Delete order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Bulk delete orders (admin)
const bulkDeleteOrders = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { orderIds } = req.body;

    const passwordCheck = await verifyAdminPassword(req);
    if (!passwordCheck.valid) {
      await t.rollback();
      return res.status(passwordCheck.status).json({
        success: false,
        message: passwordCheck.message
      });
    }

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'No orders selected for deletion'
      });
    }

    const uniqueIds = [...new Set(orderIds.map((id) => String(id).trim()).filter(Boolean))];
    const deleted = [];
    const skipped = [];

    for (const orderId of uniqueIds) {
      const deletedOrder = await deleteOrderById(orderId, t);
      if (deletedOrder) {
        deleted.push({ id: orderId });
      } else {
        skipped.push({ id: orderId, reason: 'Order not found' });
      }
    }

    await t.commit();
    res.json({
      success: true,
      message: `Deleted ${deleted.length} order(s)${skipped.length ? `, skipped ${skipped.length}` : ''}`,
      data: { deleted, skipped }
    });
  } catch (error) {
    await t.rollback();
    console.error('Bulk delete orders error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create personalized t-shirt order (sends design image to admin)
const createPersonalizedTShirtOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // Get user info if authenticated, otherwise use guest info
    const userId = req.user?.userId || null;
    const { tshirtColor, notes } = req.body;
    
    // Parse JSON strings from FormData
    let shippingAddress = null;
    let billingInfo = null;
    
    try {
      if (req.body.shippingAddress) {
        shippingAddress = typeof req.body.shippingAddress === 'string' 
          ? JSON.parse(req.body.shippingAddress) 
          : req.body.shippingAddress;
      }
      if (req.body.billingInfo) {
        billingInfo = typeof req.body.billingInfo === 'string' 
          ? JSON.parse(req.body.billingInfo) 
          : req.body.billingInfo;
      }
    } catch (parseError) {
      console.error('Error parsing JSON from FormData:', parseError);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid shipping address or billing information format' 
      });
    }
    
    // Validate required fields
    if (!billingInfo || !billingInfo.firstName || !billingInfo.lastName || !billingInfo.email || !billingInfo.phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Billing information (firstName, lastName, email, phone) is required' 
      });
    }
    
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
      return res.status(400).json({ 
        success: false, 
        message: 'Complete shipping address (street, city, state, zipCode, country) is required' 
      });
    }
    
    // Get the uploaded design image
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Design image is required' });
    }
    
    const designImage = req.files[0];
    const designImageUrl = `/uploads/${designImage.filename}`;
    
    // Prepare customer information
    let customerInfo;
    let customerType;
    
    if (userId) {
      const user = await User.findByPk(userId, { transaction: t });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      
      customerType = 'registered';
      // Use billing info provided, but fallback to user info if missing
      customerInfo = {
        email: billingInfo.email || user.email,
        firstName: billingInfo.firstName || user.firstName,
        lastName: billingInfo.lastName || user.lastName,
        phone: billingInfo.phone || user.phone || null
      };
    } else {
      // Guest order - use billing info
      customerType = 'guest';
      customerInfo = {
        email: billingInfo.email,
        firstName: billingInfo.firstName,
        lastName: billingInfo.lastName,
        phone: billingInfo.phone || null
      };
    }
    
    // Create order with personalized design info in notes
    const orderNotes = `Personalized T-Shirt Order\n` +
      `T-Shirt Color: ${tshirtColor || 'Not specified'}\n` +
      `Design Image: ${designImageUrl}\n` +
      (notes ? `Additional Notes: ${notes}` : '');
    
    const order = await Order.create({
      userId,
      customerType,
      customerInfo,
      status: 'pending',
      totalAmountCents: 0, // Will be set by admin
      shippingCostCents: 0,
      currency: 'TND',
      paymentMethod: 'cash_on_delivery',
      shippingAddress: shippingAddress,
      billingInfo: billingInfo,
      notes: orderNotes,
      verificationExpiresAt: defaultVerificationExpiresAt(),
      stockLocked: false
    }, { transaction: t });
    
    await t.commit();
    
    const created = await Order.findByPk(order.id, {
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'firstName', 'lastName'], required: false }
      ]
    });

    if (hasMailTransport() && created) {
      sendTransactional(
        sendPersonalizedOrderEmails(created, { designImageUrl, tshirtColor }),
        'personalized-order'
      );
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Personalized t-shirt order submitted successfully. Admin will review your design.',
      data: { order: created, designImageUrl } 
    });
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error('Create personalized t-shirt order error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Count new orders (pending or confirmed status) - for admin notification badge
const countNewOrders = async (req, res) => {
  try {
    const newOrders = await Order.findAll({
      where: {
        status: {
          [Op.in]: ['pending', 'confirmed']
        }
      },
      attributes: ['id'],
      order: [['createdAt', 'DESC']]
    });
    
    const orderIds = newOrders.map(order => order.id);
    const count = orderIds.length;
    
    res.json({ success: true, data: { count, orderIds } });
  } catch (error) {
    console.error('Count new orders error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  listOrders,
  getOrderById,
  getUserOrders,
  getUserOrderById,
  createOrder,
  createUserOrder,
  createGuestOrder,
  updateOrderStatus,
  deleteOrder,
  bulkDeleteOrders,
  createPersonalizedTShirtOrder,
  countNewOrders
};






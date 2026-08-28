const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const ProductVariant = require('../models/ProductVariant');
const { findMatchingVariant, getActiveVariants } = require('./variantHelpers');
const { isSoldBadge, isMadeToOrderProduct } = require('./productAvailability');

/**
 * Soft-hold statuses: phone verified / in transit, but COD not accepted at door yet.
 * Stock qty is not decremented until delivered.
 */
const ORDERING_STATUSES = ['confirmed', 'processing', 'paid', 'shipped'];

/** Statuses that have already taken stock (finalized after door acceptance). */
const STOCK_LOCKED_STATUSES = ['delivered'];

const isOrderingStatus = (status) => ORDERING_STATUSES.includes(status);
const isStockLockedStatus = (status) => STOCK_LOCKED_STATUSES.includes(status);

const productReservationKey = (productId, color, size) =>
	`${productId}::${String(color || '').trim().toLowerCase()}::${String(size || '').trim()}`;

const emptyReservedMap = () => ({
	byVariantId: new Map(),
	byProductKey: new Map()
});

const getReservedQtyMap = async (productIds, { transaction, excludeOrderId } = {}) => {
	const reserved = emptyReservedMap();
	const ids = [...new Set(
		(productIds || [])
			.map((id) => parseInt(id, 10))
			.filter((id) => Number.isFinite(id))
	)];
	if (ids.length === 0) return reserved;

	const { Order, OrderItem } = require('../models/associations');
	const { Op } = require('sequelize');

	const orderWhere = {
		status: { [Op.in]: ORDERING_STATUSES }
	};
	if (excludeOrderId) {
		orderWhere.id = { [Op.ne]: excludeOrderId };
	}

	const items = await OrderItem.findAll({
		attributes: ['variantId', 'productId', 'color', 'size', 'quantity'],
		where: { productId: { [Op.in]: ids } },
		include: [{
			model: Order,
			attributes: [],
			required: true,
			where: orderWhere
		}],
		transaction
	});

	for (const item of items) {
		const qty = Number(item.quantity) || 0;
		if (!qty) continue;
		if (item.variantId != null) {
			const vid = Number(item.variantId);
			reserved.byVariantId.set(vid, (reserved.byVariantId.get(vid) || 0) + qty);
		} else {
			const key = productReservationKey(item.productId, item.color, item.size);
			reserved.byProductKey.set(key, (reserved.byProductKey.get(key) || 0) + qty);
		}
	}

	return reserved;
};

const getReservedQtyForVariant = (reserved, variant) => {
	if (!reserved || !variant) return 0;
	if (variant.id != null) {
		const byId = reserved.byVariantId.get(Number(variant.id));
		if (byId) return byId;
	}
	return reserved.byProductKey.get(
		productReservationKey(variant.productId, variant.color, variant.size)
	) || 0;
};

const sumReservedForProduct = (reserved, productId) => {
	if (!reserved?.byProductKey) return 0;
	const prefix = `${productId}::`;
	let sum = 0;
	for (const [key, qty] of reserved.byProductKey) {
		if (String(key).startsWith(prefix)) sum += qty;
	}
	return sum;
};

const availableQty = (warehouseQty, reservedQty) =>
	Math.max(0, (Number(warehouseQty) || 0) - (Number(reservedQty) || 0));

const getProductVariants = async (productId, transaction) => {
	return ProductVariant.findAll({
		where: { productId, isActive: true },
		transaction
	});
};

const resolveOrderVariant = async (product, item, transaction) => {
	const variants = await getProductVariants(product.id, transaction);
	const active = getActiveVariants(variants);
	if (active.length === 0) return null;

	if (item.variantId) {
		const byId = active.find((v) => v.id === parseInt(item.variantId, 10));
		if (byId) return byId;
	}

	return findMatchingVariant(active, {
		variantId: item.variantId,
		color: item.color,
		size: item.size
	});
};

const checkItemStockAvailability = async (product, item, quantity) => {
	const variant = await resolveOrderVariant(product, item);
	const reserved = await getReservedQtyMap([product.id]);

	if (variant) {
		const stock = availableQty(variant.quantity, getReservedQtyForVariant(reserved, variant));
		return { available: stock >= quantity, stock, variant };
	}

	const variants = await getProductVariants(product.id);
	const hasVariants = getActiveVariants(variants).length > 0;
	if (
		item.size &&
		product.size &&
		product.size.trim().length > 0 &&
		!hasVariants &&
		isMadeToOrderProduct({ ...product.toJSON?.() ?? product, variants, hasVariants })
	) {
		return { available: true, stock: 999, variant: null };
	}

	if (isSoldBadge(product) && !hasVariants) {
		return { available: false, stock: 0, variant: null };
	}

	const stock = availableQty(product.quantity, sumReservedForProduct(reserved, product.id));
	return { available: stock >= quantity, stock, variant: null };
};

/**
 * Atomically decrement stock. Returns { success, madeToOrder }.
 * Throws if insufficient stock (non-made-to-order).
 */
const reduceItemStock = async (product, item, quantity, transaction) => {
	const qty = Number(quantity);
	if (!Number.isFinite(qty) || qty <= 0) {
		throw new Error('Invalid stock quantity');
	}

	const variant = await resolveOrderVariant(product, item, transaction);
	if (variant) {
		const rows = await sequelize.query(
			`UPDATE "ProductVariant"
       SET quantity = quantity - :qty, "updatedAt" = NOW()
       WHERE id = :id AND quantity >= :qty
       RETURNING id`,
			{
				replacements: { id: variant.id, qty },
				type: QueryTypes.SELECT,
				transaction
			}
		);
		if (!rows || rows.length === 0) {
			const err = new Error('INSUFFICIENT_STOCK');
			err.code = 'INSUFFICIENT_STOCK';
			err.productName = product.name;
			err.item = item;
			throw err;
		}
		return { success: true, madeToOrder: false };
	}

	const variants = await getProductVariants(product.id, transaction);
	const hasVariants = getActiveVariants(variants).length > 0;
	if (
		item.size &&
		product.size &&
		product.size.trim().length > 0 &&
		!hasVariants &&
		isMadeToOrderProduct({ ...product.toJSON?.() ?? product, variants, hasVariants })
	) {
		return { success: true, madeToOrder: true };
	}

	const productRows = await sequelize.query(
		`UPDATE "Product"
     SET quantity = quantity - :qty, "updatedAt" = NOW()
     WHERE id = :id AND quantity >= :qty
     RETURNING id`,
		{
			replacements: { id: product.id, qty },
			type: QueryTypes.SELECT,
			transaction
		}
	);
	if (!productRows || productRows.length === 0) {
		const err = new Error('INSUFFICIENT_STOCK');
		err.code = 'INSUFFICIENT_STOCK';
		err.productName = product.name;
		err.item = item;
		throw err;
	}
	return { success: true, madeToOrder: false };
};

const restoreItemStock = async (product, item, quantity, transaction) => {
	const qty = Number(quantity);
	if (!Number.isFinite(qty) || qty <= 0) return;

	const variant = await resolveOrderVariant(product, item, transaction);
	if (variant) {
		await sequelize.query(
			`UPDATE "ProductVariant"
       SET quantity = quantity + :qty, "updatedAt" = NOW()
       WHERE id = :id`,
			{
				replacements: { id: variant.id, qty },
				type: QueryTypes.UPDATE,
				transaction
			}
		);
		return;
	}

	const variants = await getProductVariants(product.id, transaction);
	const hasVariants = getActiveVariants(variants).length > 0;
	if (
		item.size &&
		product.size &&
		product.size.trim().length > 0 &&
		!hasVariants &&
		isMadeToOrderProduct({ ...product.toJSON?.() ?? product, variants, hasVariants })
	) {
		return;
	}

	await sequelize.query(
		`UPDATE "Product"
     SET quantity = quantity + :qty, "updatedAt" = NOW()
     WHERE id = :id`,
		{
			replacements: { id: product.id, qty },
			type: QueryTypes.UPDATE,
			transaction
		}
	);
};

module.exports = {
	getProductVariants,
	resolveOrderVariant,
	checkItemStockAvailability,
	reduceItemStock,
	restoreItemStock,
	ORDERING_STATUSES,
	STOCK_LOCKED_STATUSES,
	isOrderingStatus,
	isStockLockedStatus,
	emptyReservedMap,
	getReservedQtyMap,
	getReservedQtyForVariant,
	sumReservedForProduct,
	availableQty
};

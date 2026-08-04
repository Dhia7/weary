const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const ProductVariant = require('../models/ProductVariant');
const { findMatchingVariant, getActiveVariants } = require('./variantHelpers');
const { isSoldBadge, isMadeToOrderProduct } = require('./productAvailability');

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
	if (isSoldBadge(product)) {
		return { available: false, stock: 0, variant: null };
	}

	const variant = await resolveOrderVariant(product, item);
	if (variant) {
		return { available: variant.quantity >= quantity, stock: variant.quantity, variant };
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

	return { available: product.quantity >= quantity, stock: product.quantity, variant: null };
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

/** Statuses that have already taken stock (locked after phone confirm). */
const STOCK_LOCKED_STATUSES = ['confirmed', 'processing', 'paid', 'shipped'];

const isStockLockedStatus = (status) => STOCK_LOCKED_STATUSES.includes(status);

module.exports = {
	getProductVariants,
	resolveOrderVariant,
	checkItemStockAvailability,
	reduceItemStock,
	restoreItemStock,
	STOCK_LOCKED_STATUSES,
	isStockLockedStatus
};

const ProductVariant = require('../models/ProductVariant');
const { findMatchingVariant, getActiveVariants } = require('./variantHelpers');

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
	if (variant) {
		return { available: variant.quantity >= quantity, stock: variant.quantity, variant };
	}

	if (item.size && product.size && product.size.trim().length > 0) {
		return { available: true, stock: 999, variant: null };
	}

	return { available: product.quantity >= quantity, stock: product.quantity, variant: null };
};

const reduceItemStock = async (product, item, quantity, transaction) => {
	const variant = await resolveOrderVariant(product, item, transaction);
	if (variant) {
		variant.quantity = Math.max(0, variant.quantity - quantity);
		await variant.save({ transaction });
		return;
	}

	if (item.size && product.size && product.size.trim().length > 0) {
		return;
	}

	product.quantity = Math.max(0, product.quantity - quantity);
	await product.save({ transaction });
};

const restoreItemStock = async (product, item, quantity, transaction) => {
	const variant = await resolveOrderVariant(product, item, transaction);
	if (variant) {
		variant.quantity += quantity;
		await variant.save({ transaction });
		return;
	}

	if (item.size && product.size && product.size.trim().length > 0) {
		return;
	}

	product.quantity += quantity;
	await product.save({ transaction });
};

module.exports = {
	getProductVariants,
	resolveOrderVariant,
	checkItemStockAvailability,
	reduceItemStock,
	restoreItemStock
};

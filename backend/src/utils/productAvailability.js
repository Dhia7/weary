const { getActiveVariants } = require('./variantHelpers');

const isSoldBadge = (product) => product?.displayBadge === 'sold';

const hasActiveVariants = (product) =>
	getActiveVariants(product?.variants || []).length > 0;

/** Product-level Sold badge only blocks purchase when there are no color variants. */
const isProductLevelSold = (product) => isSoldBadge(product) && !hasActiveVariants(product);

const isMadeToOrderProduct = (product) => {
	const hasSizes = product?.size && String(product.size).trim().length > 0;
	const variants = product?.variants || [];
	const hasVariants = getActiveVariants(variants).length > 0;
	return hasSizes && !hasVariants && !isSoldBadge(product);
};

const isProductUnavailable = (product) => {
	if (!product) return true;

	const variants = product.variants || [];
	const activeVariants = getActiveVariants(variants);
	if (activeVariants.length > 0) {
		const totalQty = activeVariants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
		return totalQty <= 0;
	}

	if (isProductLevelSold(product)) return true;
	if (isMadeToOrderProduct(product)) return false;

	return (Number(product.quantity) || 0) <= 0;
};

module.exports = {
	isSoldBadge,
	isProductLevelSold,
	isMadeToOrderProduct,
	isProductUnavailable
};

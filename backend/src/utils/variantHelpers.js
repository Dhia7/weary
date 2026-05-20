const ProductVariant = require('../models/ProductVariant');

const slugifyCode = (value) => {
	if (!value || typeof value !== 'string') return 'VAR';
	return value
		.trim()
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 20) || 'VAR';
};

const parseVariantsPayload = (raw) => {
	if (!raw) return [];
	if (typeof raw === 'string') {
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return Array.isArray(raw) ? raw : [];
};

const buildVariantSku = (parentSku, colorCode, size) => {
	const base = slugifyCode(parentSku);
	const color = slugifyCode(colorCode);
	const sizePart = size && String(size).trim() ? slugifyCode(size) : null;
	return sizePart ? `${base}-${color}-${sizePart}` : `${base}-${color}`;
};

const syncProductVariants = async (productId, variantsPayload, parentSku, transaction) => {
	const incoming = parseVariantsPayload(variantsPayload);
	const existing = await ProductVariant.findAll({
		where: { productId },
		transaction
	});
	const existingById = new Map(existing.map((v) => [v.id, v]));
	const keepIds = new Set();

	for (let i = 0; i < incoming.length; i++) {
		const row = incoming[i];
		if (!row || !row.color || !String(row.color).trim()) continue;

		const color = String(row.color).trim();
		const colorCode = row.colorCode ? String(row.colorCode).trim() : slugifyCode(color);
		const size = row.size && String(row.size).trim() ? String(row.size).trim() : null;
		const sku =
			row.SKU && String(row.SKU).trim()
				? String(row.SKU).trim()
				: buildVariantSku(parentSku, colorCode, size);

		const payload = {
			productId,
			SKU: sku,
			color,
			colorCode,
			colorHex: row.colorHex || null,
			size,
			quantity: Math.max(0, parseInt(row.quantity, 10) || 0),
			price: row.price != null && row.price !== '' ? parseFloat(row.price) : null,
			compareAtPrice:
				row.compareAtPrice != null && row.compareAtPrice !== ''
					? parseFloat(row.compareAtPrice)
					: null,
			imageUrl: row.imageUrl || null,
			images: Array.isArray(row.images) ? row.images : row.imageUrl ? [row.imageUrl] : [],
			isActive: row.isActive !== false && row.isActive !== 'false',
			sortOrder: row.sortOrder != null ? parseInt(row.sortOrder, 10) : i
		};

		if (row.id && existingById.has(row.id)) {
			const record = existingById.get(row.id);
			await record.update(payload, { transaction });
			keepIds.add(record.id);
		} else {
			const created = await ProductVariant.create(payload, { transaction });
			keepIds.add(created.id);
		}
	}

	for (const record of existing) {
		if (!keepIds.has(record.id)) {
			await record.destroy({ transaction });
		}
	}

	return ProductVariant.findAll({
		where: { productId },
		order: [
			['sortOrder', 'ASC'],
			['color', 'ASC'],
			['size', 'ASC']
		],
		transaction
	});
};

const getActiveVariants = (variants) =>
	(variants || []).filter((v) => v.isActive !== false);

const deriveColorOptions = (variants, productPrice = 0) => {
	const map = new Map();
	const basePrice = parseFloat(productPrice) || 0;
	for (const v of getActiveVariants(variants)) {
		const json = v.toJSON ? v.toJSON() : v;
		const key = `${json.color}::${json.colorHex || ''}`;
		const effectivePrice =
			json.price != null && json.price !== '' ? parseFloat(json.price) : basePrice;
		if (!map.has(key)) {
			map.set(key, {
				name: json.color,
				hex: json.colorHex || null,
				imageUrl: json.imageUrl || (Array.isArray(json.images) && json.images[0]) || null,
				price: effectivePrice
			});
		} else {
			const existing = map.get(key);
			if (effectivePrice < existing.price) {
				existing.price = effectivePrice;
			}
		}
	}
	return Array.from(map.values());
};

const computePriceRange = (variants, productPrice = 0) => {
	const active = getActiveVariants(variants);
	if (!active.length) return null;
	const basePrice = parseFloat(productPrice) || 0;
	const prices = active.map((v) => {
		const json = v.toJSON ? v.toJSON() : v;
		return json.price != null && json.price !== '' ? parseFloat(json.price) : basePrice;
	});
	const min = Math.min(...prices);
	const max = Math.max(...prices);
	return {
		min,
		max,
		hasVariablePricing: Math.abs(min - max) > 0.001
	};
};

const deriveSizeOptions = (variants) => {
	const sizes = new Set();
	for (const v of getActiveVariants(variants)) {
		if (v.size && String(v.size).trim()) sizes.add(String(v.size).trim());
	}
	return Array.from(sizes);
};

const findMatchingVariant = (variants, { variantId, color, size }) => {
	const active = getActiveVariants(variants);
	if (variantId) {
		const byId = active.find((v) => v.id === parseInt(variantId, 10));
		if (byId) return byId;
	}
	if (!color) return null;
	const normalizedColor = String(color).trim().toLowerCase();
	const normalizedSize = size && String(size).trim() ? String(size).trim() : null;

	return active.find((v) => {
		const colorMatch = String(v.color).trim().toLowerCase() === normalizedColor;
		if (!normalizedSize) {
			return colorMatch && (!v.size || !String(v.size).trim());
		}
		return colorMatch && String(v.size || '').trim() === normalizedSize;
	});
};

const getVariantPrice = (variant, product) => {
	const base = parseFloat(product?.price) || 0;
	if (!variant) return base;
	const variantPrice =
		variant.price != null && variant.price !== '' ? parseFloat(variant.price) : null;
	if (variantPrice != null && !Number.isNaN(variantPrice)) return variantPrice;
	return base;
};

/** Resolve storefront/cart line price from variant, variantId, or color. */
const resolveCartLinePrice = (product, cartRow, linkedVariant = null) => {
	const base = parseFloat(product?.price) || 0;
	const variants = product?.variants || [];
	const variantId = cartRow?.variantId ?? linkedVariant?.id;
	const color = cartRow?.color || linkedVariant?.color;
	const size = cartRow?.size || linkedVariant?.size;

	let variant = linkedVariant;
	if (!variant && variantId && variants.length) {
		variant = variants.find((v) => v.id === parseInt(variantId, 10));
	}
	if (!variant && color && variants.length) {
		variant = findMatchingVariant(variants, { variantId, color, size });
	}

	if (variant) {
		const priced = getVariantPrice(variant, product);
		if (priced !== base || (variant.price != null && variant.price !== '')) {
			return priced;
		}
	}

	if (color && variants.length) {
		const normalized = String(color).trim().toLowerCase();
		const colorMatches = getActiveVariants(variants).filter(
			(v) => String(v.color).trim().toLowerCase() === normalized
		);
		if (colorMatches.length) {
			return Math.min(...colorMatches.map((v) => getVariantPrice(v, product)));
		}
	}

	return base;
};

const getVariantStockInfo = (variant, isAdmin = false) => {
	const qty = variant ? variant.quantity : 0;
	const isInStock = qty > 0;
	const isLowStock = qty > 0 && qty <= 10;
	const status = qty > 10 ? 'In Stock' : qty > 0 ? 'Low Stock' : 'Out of Stock';
	if (isAdmin) {
		return { quantity: qty, status, isInStock, isLowStock };
	}
	return { status, isInStock, isLowStock };
};

const computeProductStockFromVariants = (variants) => {
	return getActiveVariants(variants).reduce((sum, v) => sum + (v.quantity || 0), 0);
};

const attachVariantSummary = (productData, variants, isAdmin = false) => {
	const activeVariants = getActiveVariants(variants);
	const hasVariants = activeVariants.length > 0;
	const colorOptions = deriveColorOptions(activeVariants, productData.price);
	const sizeOptions = deriveSizeOptions(activeVariants);
	const priceRange = hasVariants ? computePriceRange(activeVariants, productData.price) : null;

	let stockInfo;
	if (hasVariants) {
		const totalQty = computeProductStockFromVariants(activeVariants);
		const isInStock = totalQty > 0;
		const isLowStock = totalQty > 0 && totalQty <= 10;
		stockInfo = isAdmin
			? {
					quantity: totalQty,
					status: totalQty > 10 ? 'In Stock' : totalQty > 0 ? 'Low Stock' : 'Out of Stock',
					isInStock,
					isLowStock
				}
			: {
					status: totalQty > 10 ? 'In Stock' : totalQty > 0 ? 'Low Stock' : 'Out of Stock',
					isInStock,
					isLowStock
				};
	}

	return {
		...productData,
		hasVariants,
		variants: activeVariants.map((v) => {
			const json = v.toJSON ? v.toJSON() : v;
			return {
				...json,
				stockInfo: getVariantStockInfo(json, isAdmin)
			};
		}),
		colorOptions,
		availableSizes: sizeOptions.length > 0 ? sizeOptions : undefined,
		...(stockInfo ? { stockInfo } : {})
	};
};

module.exports = {
	slugifyCode,
	parseVariantsPayload,
	buildVariantSku,
	syncProductVariants,
	getActiveVariants,
	deriveColorOptions,
	computePriceRange,
	deriveSizeOptions,
	findMatchingVariant,
	getVariantPrice,
	resolveCartLinePrice,
	getVariantStockInfo,
	computeProductStockFromVariants,
	attachVariantSummary
};

const { Op } = require('sequelize');
const StockWaitlist = require('../models/StockWaitlist');
const Product = require('../models/Product');
const {
	hasMailTransport,
	sendStockAvailableEmail,
	sendTransactional
} = require('./mail');

const NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Notify waitlist entries for a product/variant that stock is available again.
 */
async function notifyWaitlistForItem(productId, variantId = null) {
	try {
		const where = {
			productId,
			[Op.or]: [
				{ notifiedAt: null },
				{ notifiedAt: { [Op.lt]: new Date(Date.now() - NOTIFY_COOLDOWN_MS) } }
			]
		};
		if (variantId != null) {
			where.variantId = variantId;
		}

		const entries = await StockWaitlist.findAll({ where, limit: 50 });
		if (entries.length === 0) return;

		const product = await Product.findByPk(productId, {
			attributes: ['id', 'name', 'slug']
		});
		if (!product) return;

		for (const entry of entries) {
			if (hasMailTransport() && entry.email) {
				sendTransactional(
					sendStockAvailableEmail({
						email: entry.email,
						product,
						variantId: entry.variantId
					}),
					'waitlist-available'
				);
			}
			entry.notifiedAt = new Date();
			await entry.save();
		}
	} catch (err) {
		console.error('notifyWaitlistForItem error:', err.message || err);
	}
}

async function notifyWaitlistForOrderItems(items) {
	if (!Array.isArray(items)) return;
	const seen = new Set();
	for (const item of items) {
		const key = `${item.productId}:${item.variantId || ''}`;
		if (seen.has(key)) continue;
		seen.add(key);
		await notifyWaitlistForItem(item.productId, item.variantId || null);
	}
}

module.exports = {
	notifyWaitlistForItem,
	notifyWaitlistForOrderItems
};

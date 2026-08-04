const Product = require('../models/Product');
const StockWaitlist = require('../models/StockWaitlist');
const { normalizeEmail, normalizePhone } = require('../utils/orderSecurity');

const joinWaitlist = async (req, res) => {
	try {
		const { id } = req.params;
		const { email, phone, variantId } = req.body || {};

		const normalizedEmail = normalizeEmail(email);
		if (!normalizedEmail) {
			return res.status(400).json({ success: false, message: 'A valid email is required' });
		}

		const product = await Product.findByPk(id);
		if (!product || !product.isActive) {
			return res.status(404).json({ success: false, message: 'Product not found' });
		}

		const normalizedPhone = normalizePhone(phone);
		const userId = req.user?.userId || null;
		const parsedVariantId = variantId != null && variantId !== ''
			? parseInt(variantId, 10)
			: null;

		const [entry, created] = await StockWaitlist.findOrCreate({
			where: {
				productId: product.id,
				email: normalizedEmail,
				variantId: Number.isFinite(parsedVariantId) ? parsedVariantId : null
			},
			defaults: {
				phone: normalizedPhone,
				userId,
				notifiedAt: null
			}
		});

		if (!created) {
			if (normalizedPhone && entry.phone !== normalizedPhone) {
				entry.phone = normalizedPhone;
			}
			if (userId && !entry.userId) {
				entry.userId = userId;
			}
			await entry.save();
		}

		return res.status(created ? 201 : 200).json({
			success: true,
			message: created
				? 'You will be notified if this item becomes available again.'
				: 'You are already on the waitlist for this item.',
			data: { id: entry.id }
		});
	} catch (error) {
		if (error.name === 'SequelizeUniqueConstraintError') {
			return res.status(200).json({
				success: true,
				message: 'You are already on the waitlist for this item.'
			});
		}
		console.error('Join waitlist error:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

module.exports = {
	joinWaitlist
};

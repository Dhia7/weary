const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Order = require('../models/Order');
const {
	hasMailTransport,
	sendOrderCancelledEmail,
	sendTransactional
} = require('../utils/mail');

const INTERVAL_MS = 15 * 60 * 1000;
let sweeperTimer = null;
let running = false;

async function cancelExpiredPendingOrders() {
	if (running) return;
	running = true;
	const t = await sequelize.transaction();
	try {
		const now = new Date();
		const expired = await Order.findAll({
			where: {
				status: 'pending',
				verificationExpiresAt: { [Op.lt]: now }
			},
			transaction: t,
			lock: t.LOCK.UPDATE
		});

		for (const order of expired) {
			order.status = 'cancelled';
			order.cancelReason = 'timeout';
			await order.save({ transaction: t });
		}

		await t.commit();

		if (hasMailTransport()) {
			for (const order of expired) {
				sendTransactional(
					sendOrderCancelledEmail(order, 'verification timeout'),
					'order-timeout-cancel'
				);
			}
		}

		if (expired.length > 0) {
			console.log(`Pending order sweeper: cancelled ${expired.length} expired order(s)`);
		}
	} catch (err) {
		if (!t.finished) await t.rollback();
		console.error('Pending order sweeper error:', err.message || err);
	} finally {
		running = false;
	}
}

function startPendingOrderSweeper() {
	if (sweeperTimer) return;
	// Run once shortly after boot, then on interval
	setTimeout(() => {
		cancelExpiredPendingOrders().catch(() => {});
	}, 10_000);
	sweeperTimer = setInterval(() => {
		cancelExpiredPendingOrders().catch(() => {});
	}, INTERVAL_MS);
	if (typeof sweeperTimer.unref === 'function') {
		sweeperTimer.unref();
	}
	console.log('Pending order verification sweeper started (every 15 min)');
}

module.exports = {
	startPendingOrderSweeper,
	cancelExpiredPendingOrders
};

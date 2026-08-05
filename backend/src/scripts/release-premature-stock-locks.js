/**
 * Restore product qty for orders that hard-locked stock on confirm.
 * Confirmed→shipped is soft-hold only; stock finalizes on delivered.
 *
 * Usage: node src/scripts/release-premature-stock-locks.js
 */
require('dotenv').config();

const { sequelize } = require('../config/database');
require('../models/associations');
const { Order, OrderItem, Product } = require('../models/associations');
const { restoreItemStock, ORDERING_STATUSES } = require('../utils/stockHelpers');
const { Op } = require('sequelize');

async function releasePrematureStockLocks() {
	const t = await sequelize.transaction();
	try {
		const orders = await Order.findAll({
			where: {
				stockLocked: true,
				status: { [Op.in]: ORDERING_STATUSES }
			},
			include: [{ model: OrderItem, as: 'items', required: true }],
			transaction: t
		});

		console.log(`Found ${orders.length} ordering order(s) with premature stock locks`);

		let restored = 0;
		for (const order of orders) {
			for (const item of order.items || []) {
				const product = await Product.findByPk(item.productId, {
					transaction: t,
					attributes: { exclude: ['sizeStock'] }
				});
				if (product) {
					await restoreItemStock(product, item, item.quantity, t);
					console.log(
						`  Restored ${item.quantity} for product #${item.productId} (order ${order.id}, status=${order.status})`
					);
				}
			}
			order.stockLocked = false;
			await order.save({ transaction: t });
			restored += 1;
		}

		await t.commit();
		console.log(`Done. Released stock locks on ${restored} order(s).`);
	} catch (err) {
		if (!t.finished) await t.rollback();
		console.error('Failed to release premature stock locks:', err);
		process.exitCode = 1;
	} finally {
		await sequelize.close();
	}
}

releasePrematureStockLocks();

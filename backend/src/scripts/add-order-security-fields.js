const { resolveTableName, addColumnIfMissing } = require('./migration-utils');

require('dotenv').config();

async function addOrderSecurityFields() {
	try {
		console.log('Running order security fields migration...');

		const orderTable = await resolveTableName(['Order', 'Orders', 'orders']);
		if (!orderTable) {
			console.log('⚠️  Order table not found');
			return;
		}
		console.log(`Using order table: ${orderTable}`);

		await addColumnIfMissing(
			orderTable,
			'cancelReason',
			'VARCHAR(80)',
			'Cancel reason: refused_at_delivery, unreachable, admin_rejected, timeout, outbid, other'
		);

		await addColumnIfMissing(
			orderTable,
			'verificationExpiresAt',
			'TIMESTAMP WITH TIME ZONE',
			'Pending orders auto-cancel after this timestamp'
		);

		await addColumnIfMissing(
			orderTable,
			'stockLocked',
			'BOOLEAN DEFAULT FALSE NOT NULL',
			'True after stock reserved on phone confirm'
		);

		console.log('🎉 Order security fields migration completed');
	} catch (error) {
		console.error('❌ Order security fields migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addOrderSecurityFields()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = addOrderSecurityFields;

const { resolveTableName, addColumnIfMissing } = require('./migration-utils');

require('dotenv').config();

async function addDisplayBadge() {
	try {
		console.log('Running displayBadge migration...');

		const productTable = await resolveTableName(['Product', 'Products', 'products']);
		if (!productTable) {
			console.log('⚠️  Product table not found');
			return;
		}
		console.log(`Using product table: ${productTable}`);

		await addColumnIfMissing(
			productTable,
			'displayBadge',
			'VARCHAR(20)',
			'Optional storefront badge: new_arrival, sold, or null for none'
		);

		console.log('🎉 displayBadge migration completed');
	} catch (error) {
		console.error('❌ displayBadge migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addDisplayBadge()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = addDisplayBadge;

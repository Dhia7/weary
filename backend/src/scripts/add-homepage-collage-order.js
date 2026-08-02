const { resolveTableName, addColumnIfMissing } = require('./migration-utils');

require('dotenv').config();

async function addHomepageCollageOrder() {
	try {
		console.log('Running homepageCollageOrder migration...');

		const productTable = await resolveTableName(['Product', 'Products', 'products']);
		if (!productTable) {
			console.log('⚠️  Product table not found');
			return;
		}
		console.log(`Using product table: ${productTable}`);

		await addColumnIfMissing(
			productTable,
			'homepageCollageOrder',
			'INT NULL',
			'Homepage View-all collage slot (1-4); null = not shown'
		);

		console.log('🎉 homepageCollageOrder migration completed');
	} catch (error) {
		console.error('❌ homepageCollageOrder migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addHomepageCollageOrder()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = addHomepageCollageOrder;

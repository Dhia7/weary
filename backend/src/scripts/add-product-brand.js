const { resolveTableName, addColumnIfMissing } = require('./migration-utils');

require('dotenv').config();

async function addProductBrand() {
	try {
		console.log('Running product brand migration...');

		const productTable = await resolveTableName(['Product', 'Products', 'products']);
		if (!productTable) {
			console.log('⚠️  Product table not found');
			return;
		}
		console.log(`Using product table: ${productTable}`);

		await addColumnIfMissing(
			productTable,
			'brand',
			'VARCHAR(80)',
			'Designer / mark shown first in bold on the shop, e.g. Jacquemus'
		);

		console.log('🎉 Product brand migration completed');
	} catch (error) {
		console.error('❌ Product brand migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addProductBrand()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = addProductBrand;

const { resolveTableName, addColumnIfMissing } = require('./migration-utils');

require('dotenv').config();

async function addDefaultDisplayColor() {
	try {
		console.log('Running defaultDisplayColor migration...');

		const productTable = await resolveTableName(['Product', 'Products', 'products']);
		if (!productTable) {
			console.log('⚠️  Product table not found');
			return;
		}
		console.log(`Using product table: ${productTable}`);

		await addColumnIfMissing(
			productTable,
			'defaultDisplayColor',
			'VARCHAR(100)',
			'Color shown first on featured products and product listings'
		);

		console.log('🎉 defaultDisplayColor migration completed');
	} catch (error) {
		console.error('❌ defaultDisplayColor migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addDefaultDisplayColor()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = addDefaultDisplayColor;

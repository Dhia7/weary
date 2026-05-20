const { resolveTableName, addColumnIfMissing } = require('./migration-utils');

async function addAllowCustomerQuantity() {
	try {
		console.log('Running allowCustomerQuantity migration...');

		const productTable = await resolveTableName(['Product', 'Products', 'products']);
		if (!productTable) {
			console.log('⚠️  Product table not found');
			return;
		}
		console.log(`Using product table: ${productTable}`);

		await addColumnIfMissing(
			productTable,
			'allowCustomerQuantity',
			'BOOLEAN NOT NULL DEFAULT false',
			'When true, customers can select quantity on product pages and in quick view'
		);

		console.log('🎉 allowCustomerQuantity migration completed');
	} catch (error) {
		console.error('❌ allowCustomerQuantity migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addAllowCustomerQuantity()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = addAllowCustomerQuantity;

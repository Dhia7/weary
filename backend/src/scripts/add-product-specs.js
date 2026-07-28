const { resolveTableName, addColumnIfMissing } = require('./migration-utils');

const SPEC_COLUMNS = [
	{ name: 'depthCm', type: 'DECIMAL(10, 2)', comment: 'Product depth in centimeters' },
	{ name: 'widthCm', type: 'DECIMAL(10, 2)', comment: 'Product width in centimeters' },
	{ name: 'heightCm', type: 'DECIMAL(10, 2)', comment: 'Product height in centimeters' },
	{ name: 'outerMaterial', type: 'VARCHAR(200)', comment: 'Outer material description' }
];

async function addProductSpecs() {
	try {
		console.log('Running product specs migration...');

		const productTable = await resolveTableName(['Product', 'Products', 'products']);
		if (!productTable) {
			console.log('⚠️  Product table not found');
			return;
		}
		console.log(`Using product table: ${productTable}`);

		for (const col of SPEC_COLUMNS) {
			await addColumnIfMissing(productTable, col.name, col.type, col.comment);
		}

		console.log('🎉 Product specs migration completed');
	} catch (error) {
		console.error('❌ Product specs migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addProductSpecs()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = addProductSpecs;

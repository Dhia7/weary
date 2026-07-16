const { resolveTableName, addColumnIfMissing } = require('./migration-utils');

require('dotenv').config();

async function addProductFrFields() {
	try {
		console.log('Running product French display fields migration...');

		const productTable = await resolveTableName(['Product', 'Products', 'products']);
		if (!productTable) {
			console.log('⚠️  Product table not found');
			return;
		}
		console.log(`Using product table: ${productTable}`);

		await addColumnIfMissing(
			productTable,
			'nameFr',
			'VARCHAR(200)',
			'French display title; falls back to name on storefront'
		);

		const variantTable = await resolveTableName([
			'ProductVariant',
			'ProductVariants',
			'product_variants',
			'productvariants'
		]);
		if (!variantTable) {
			console.log('⚠️  ProductVariant table not found');
			return;
		}
		console.log(`Using variant table: ${variantTable}`);

		await addColumnIfMissing(
			variantTable,
			'colorFr',
			'VARCHAR(80)',
			'French display color name; falls back to color on storefront'
		);

		console.log('🎉 Product French display fields migration completed');
	} catch (error) {
		console.error('❌ Product French display fields migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addProductFrFields()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = addProductFrFields;

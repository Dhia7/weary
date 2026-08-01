const { resolveTableName, addColumnIfMissing } = require('./migration-utils');

require('dotenv').config();

async function addHoverImageIndex() {
	try {
		console.log('Running hoverImageIndex migration...');

		const variantTable = await resolveTableName([
			'ProductVariant',
			'ProductVariants',
			'product_variants',
			'productvariants'
		]);
		// Prefer the singular Sequelize table (freezeTableName: true → "ProductVariant")
		const productTableExact = await resolveTableName(['Product']);
		if (productTableExact) {
			console.log(`Using product table: ${productTableExact}`);
			await addColumnIfMissing(
				productTableExact,
				'hoverImageIndex',
				'INT NULL',
				'Index of the orbit/listing hover image in the images array'
			);
		} else {
			console.log('⚠️  Product table not found');
		}

		if (variantTable) {
			console.log(`Using variant table: ${variantTable}`);
			await addColumnIfMissing(
				variantTable,
				'hoverImageIndex',
				'INT NULL',
				'Index of the hover/swap image in this color gallery'
			);
		} else {
			console.log('⚠️  ProductVariant table not found');
		}

		// Also ensure singular name if resolve picked a plural leftover
		if (variantTable !== 'ProductVariant') {
			const singular = await resolveTableName(['ProductVariant']);
			if (singular === 'ProductVariant') {
				await addColumnIfMissing(
					'ProductVariant',
					'hoverImageIndex',
					'INT NULL',
					'Index of the hover/swap image in this color gallery'
				);
			}
		}

		console.log('🎉 hoverImageIndex migration completed');
	} catch (error) {
		console.error('❌ hoverImageIndex migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addHoverImageIndex()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = addHoverImageIndex;

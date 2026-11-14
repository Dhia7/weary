require('dotenv').config();

const { sequelize, resolveTableName, addColumnIfMissing } = require('./migration-utils');

async function addProductSortOrder() {
	try {
		console.log('Running product sortOrder migration...');

		const productTable = await resolveTableName(['Product', 'Products', 'products']);
		if (!productTable) {
			console.log('⚠️  Product table not found');
			return;
		}
		console.log(`Using product table: ${productTable}`);

		const added = await addColumnIfMissing(
			productTable,
			'sortOrder',
			'INTEGER NOT NULL DEFAULT 0',
			'Manual catalog order; lower numbers appear first'
		);

		if (added) {
			await sequelize.query(`
				WITH ranked AS (
					SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" DESC, id DESC) - 1 AS ord
					FROM "${productTable}"
				)
				UPDATE "${productTable}" AS p
				SET "sortOrder" = ranked.ord
				FROM ranked
				WHERE p.id = ranked.id
			`);
			console.log('✅ Backfilled sortOrder from newest-first');
		}

		await sequelize.query(`
			CREATE INDEX IF NOT EXISTS "product_sort_order_idx"
			ON "${productTable}" ("sortOrder")
		`);

		console.log('🎉 Product sortOrder migration completed');
	} catch (error) {
		console.error('❌ Product sortOrder migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addProductSortOrder()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = addProductSortOrder;

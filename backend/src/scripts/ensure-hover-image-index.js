/**
 * Ensure hoverImageIndex exists on the exact tables Sequelize queries:
 * "Product" and "ProductVariant" (singular).
 */
require('dotenv').config();
const { sequelize, columnExists, addColumnIfMissing } = require('./migration-utils');

async function ensureHoverColumns() {
	try {
		await sequelize.authenticate();
		console.log('Connected.\n');

		const targets = [
			{
				table: 'Product',
				comment: 'Index of the orbit/listing hover image in the images array',
			},
			{
				table: 'ProductVariant',
				comment: 'Index of the hover/swap image in this color gallery',
			},
			{
				table: 'ProductVariants',
				comment: 'Index of the hover/swap image in this color gallery',
			},
		];

		for (const { table, comment } of targets) {
			const [tables] = await sequelize.query(
				`
				SELECT table_name FROM information_schema.tables
				WHERE table_schema = 'public' AND table_name = $1
				`,
				{ bind: [table] }
			);
			if (!Array.isArray(tables) || !tables.length) {
				console.log(`⏭️  Table "${table}" not found — skip`);
				continue;
			}

			const exists = await columnExists(table, 'hoverImageIndex');
			console.log(`"${table}".hoverImageIndex exists? ${exists}`);

			// Also list any hover* columns (casing / leftovers)
			const [cols] = await sequelize.query(
				`
				SELECT column_name FROM information_schema.columns
				WHERE table_schema = 'public' AND table_name = $1
				AND column_name ILIKE '%hover%'
				`,
				{ bind: [table] }
			);
			console.log(
				`  hover-related columns:`,
				Array.isArray(cols) ? cols.map((c) => c.column_name) : []
			);

			await addColumnIfMissing(table, 'hoverImageIndex', 'INT NULL', comment);
		}

		// Smoke-test the exact select shape Sequelize uses
		await sequelize.query(
			`SELECT "id", "hoverImageIndex" FROM "Product" LIMIT 1`
		);
		console.log('\n✅ SELECT Product.hoverImageIndex works');

		await sequelize.query(
			`SELECT "id", "hoverImageIndex" FROM "ProductVariant" LIMIT 1`
		);
		console.log('✅ SELECT ProductVariant.hoverImageIndex works');

		console.log('\n🎉 Done');
	} catch (error) {
		console.error('❌ Failed:', error.message || error);
		throw error;
	} finally {
		await sequelize.close();
	}
}

if (require.main === module) {
	ensureHoverColumns()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = ensureHoverColumns;

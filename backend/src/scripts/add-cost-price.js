require('dotenv').config();
const { sequelize } = require('./migration-utils');

async function columnExists(table, column) {
	const [rows] = await sequelize.query(`
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public'
		AND table_name = '${table}'
		AND column_name = '${column}'
		LIMIT 1
	`);
	return Array.isArray(rows) && rows.length > 0;
}

async function addColumnIfMissing(table, column, def, comment) {
	if (await columnExists(table, column)) {
		console.log(`ℹ️  ${table}.${column} already exists`);
		return false;
	}
	await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${def}`);
	if (comment) {
		await sequelize.query(
			`COMMENT ON COLUMN "${table}"."${column}" IS '${comment.replace(/'/g, "''")}'`
		);
	}
	console.log(`✅ Added ${table}.${column}`);
	return true;
}

async function addCostPrice() {
	try {
		console.log('Running costPrice migration...');
		await sequelize.authenticate();

		// freezeTableName: true — model names match table names
		await addColumnIfMissing(
			'Product',
			'costPrice',
			'DECIMAL(12, 2)',
			'Purchase / buy cost of the item (what we paid)'
		);
		await addColumnIfMissing(
			'ProductVariant',
			'costPrice',
			'DECIMAL(12, 2)',
			'Override buy cost; null uses parent product costPrice'
		);
		await addColumnIfMissing(
			'OrderItem',
			'unitCostCents',
			'INTEGER DEFAULT 0',
			'Snapshotted buy cost in cents at order time'
		);

		console.log('🎉 costPrice migration completed');
	} catch (error) {
		console.error('❌ costPrice migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addCostPrice()
		.then(() => sequelize.close().then(() => process.exit(0)))
		.catch(() => sequelize.close().then(() => process.exit(1)));
}

module.exports = addCostPrice;

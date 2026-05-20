const { sequelize } = require('../config/database');

/**
 * Resolve actual PostgreSQL table name (Sequelize freezeTableName uses model names like "Product", "Cart").
 */
async function resolveTableName(candidates) {
	const names = Array.isArray(candidates) ? candidates : [candidates];
	for (const name of names) {
		const [rows] = await sequelize.query(
			`
			SELECT table_name
			FROM information_schema.tables
			WHERE table_schema = 'public'
			AND table_name = $1
		`,
			{ bind: [name] }
		);
		if (rows.length > 0) return rows[0].table_name;
	}

	const pattern = names[0];
	const [rows] = await sequelize.query(
		`
		SELECT table_name
		FROM information_schema.tables
		WHERE table_schema = 'public'
		AND table_name ILIKE $1
		ORDER BY length(table_name) ASC
		LIMIT 1
	`,
		{ bind: [pattern] }
	);
	return rows[0]?.table_name || null;
}

async function columnExists(tableName, columnName) {
	const [rows] = await sequelize.query(
		`
		SELECT column_name FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
	`,
		{ bind: [tableName, columnName] }
	);
	return rows.length > 0;
}

async function addColumnIfMissing(tableName, columnName, columnDef, comment) {
	if (await columnExists(tableName, columnName)) {
		console.log(`ℹ️  ${tableName}.${columnName} already exists`);
		return false;
	}
	await sequelize.query(`
		ALTER TABLE "${tableName}"
		ADD COLUMN "${columnName}" ${columnDef}
	`);
	if (comment) {
		await sequelize.query(`
			COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${comment.replace(/'/g, "''")}'
		`);
	}
	console.log(`✅ Added ${tableName}.${columnName}`);
	return true;
}

module.exports = { sequelize, resolveTableName, columnExists, addColumnIfMissing };

/**
 * Run all pending schema migrations against the configured DATABASE_URL.
 * Usage: node src/scripts/run-pending-migrations.js
 */
require('dotenv').config();

async function main() {
	const { sequelize } = require('./migration-utils');

	try {
		await sequelize.authenticate();
		console.log('Connected to database.\n');

		await require('./add-size-to-cart')();
		console.log('');
		await require('./add-product-variants')();
		console.log('');
		await require('./add-product-specs')();
		console.log('');
		await require('./add-avatar-url-to-users')();
		console.log('');
		await require('./add-product-fr-fields')();
		console.log('\n✅ All migrations finished.');
	} catch (error) {
		console.error('\n❌ Migration run failed:', error.message);
		process.exit(1);
	} finally {
		await sequelize.close();
	}
}

main();

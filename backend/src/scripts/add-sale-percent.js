require('dotenv').config();
const { sequelize, addColumnIfMissing } = require('./migration-utils');

async function addSalePercent() {
	try {
		console.log('Running salePercent migration...');
		await sequelize.authenticate();
		await addColumnIfMissing(
			'Product',
			'salePercent',
			'DECIMAL(5, 2)',
			'Off-percent shown on the product. Does not change the sold price.'
		);
		console.log('salePercent migration completed');
	} catch (error) {
		console.error('salePercent migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addSalePercent()
		.then(() => sequelize.close().then(() => process.exit(0)))
		.catch(() => sequelize.close().then(() => process.exit(1)));
}

module.exports = addSalePercent;

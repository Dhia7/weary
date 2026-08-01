require('dotenv').config();
const { sequelize } = require('./migration-utils');

(async () => {
	await sequelize.authenticate();
	const [countRows] = await sequelize.query('SELECT COUNT(*)::int AS c FROM "Product"');
	console.log('Product count:', countRows[0]?.c);
	const [sample] = await sequelize.query(
		'SELECT id, name, "hoverImageIndex" FROM "Product" ORDER BY id LIMIT 5'
	);
	console.log('Sample:', sample);
	await sequelize.query('SELECT id, "hoverImageIndex" FROM "ProductVariant" LIMIT 1');
	console.log('ProductVariant.hoverImageIndex OK');
	await sequelize.close();
})().catch(async (e) => {
	console.error(e.message);
	try {
		await sequelize.close();
	} catch {}
	process.exit(1);
});

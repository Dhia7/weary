require('dotenv').config();
const { sequelize } = require('./migration-utils');

(async () => {
	await sequelize.authenticate();
	for (const t of ['Product', 'Cart', 'OrderItem', 'ProductVariant']) {
		const [cols] = await sequelize.query(
			`SELECT column_name FROM information_schema.columns
			 WHERE table_schema='public' AND table_name='${t}'
			 ORDER BY column_name`
		);
		console.log(
			t + ':',
			cols.map((c) => c.column_name).join(', ') || '(table not found)'
		);
	}
	await sequelize.close();
})();

const { sequelize, resolveTableName, columnExists, addColumnIfMissing } = require('./migration-utils');

async function addProductVariants() {
	try {
		console.log('Running product variants migration...');

		const productTable = await resolveTableName(['Product', 'Products']);
		if (!productTable) {
			throw new Error('Product table not found');
		}
		console.log(`Using product table: ${productTable}`);

		const variantTable = await resolveTableName(['ProductVariant', 'ProductVariants']);
		if (!variantTable) {
			await sequelize.query(`
				CREATE TABLE "ProductVariant" (
					"id" SERIAL PRIMARY KEY,
					"productId" INTEGER NOT NULL REFERENCES "${productTable}"("id") ON DELETE CASCADE,
					"SKU" VARCHAR(100) NOT NULL UNIQUE,
					"color" VARCHAR(80) NOT NULL,
					"colorCode" VARCHAR(20),
					"colorHex" VARCHAR(7),
					"size" VARCHAR(50),
					"quantity" INTEGER NOT NULL DEFAULT 0,
					"price" DECIMAL(12, 2),
					"compareAtPrice" DECIMAL(12, 2),
					"imageUrl" VARCHAR(500),
					"images" JSONB DEFAULT '[]',
					"isActive" BOOLEAN DEFAULT true,
					"sortOrder" INTEGER NOT NULL DEFAULT 0,
					"createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
					"updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
				)
			`);
			console.log('✅ Created ProductVariant table');
		} else {
			console.log(`ℹ️  Variant table already exists: ${variantTable}`);
		}

		const effectiveVariantTable = (await resolveTableName(['ProductVariant', 'ProductVariants'])) || 'ProductVariant';

		await sequelize.query(`
			CREATE INDEX IF NOT EXISTS "product_variant_product_id"
			ON "${effectiveVariantTable}" ("productId")
		`);

		const cartTable = await resolveTableName(['Cart', 'carts']);
		const orderItemTable = await resolveTableName(['OrderItem', 'OrderItems', 'orderitems']);

		for (const tableName of [cartTable, orderItemTable].filter(Boolean)) {
			if (!(await columnExists(tableName, 'variantId'))) {
				await sequelize.query(`
					ALTER TABLE "${tableName}"
					ADD COLUMN "variantId" INTEGER NULL
				`);
				console.log(`✅ variantId added to ${tableName}`);
			}
			await addColumnIfMissing(tableName, 'color', 'VARCHAR(80) NULL', 'Selected color display name');

			// FK only if variant table exists and FK not already there
			try {
				await sequelize.query(`
					ALTER TABLE "${tableName}"
					ADD CONSTRAINT "${tableName}_variantId_fkey"
					FOREIGN KEY ("variantId") REFERENCES "${effectiveVariantTable}"("id") ON DELETE SET NULL
				`);
			} catch (err) {
				if (!err.message?.includes('already exists')) {
					console.log(`ℹ️  FK for ${tableName}.variantId:`, err.message?.split('\n')[0]);
				}
			}
		}

		if (cartTable) {
			await sequelize.query(`DROP INDEX IF EXISTS "unique_user_product_variant_cart"`);
			try {
				await sequelize.query(`
					CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_product_variant_cart"
					ON "${cartTable}" ("userId", "productId", "variantId")
					WHERE "variantId" IS NOT NULL
				`);
				console.log(`✅ Cart variant unique index on ${cartTable}`);
			} catch (err) {
				console.warn('Cart index skipped:', err.message?.split('\n')[0]);
			}
		}

		console.log('🎉 Product variants migration completed');
	} catch (error) {
		console.error('❌ Product variants migration failed:', error);
		throw error;
	}
}

if (require.main === module) {
	addProductVariants()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}

module.exports = addProductVariants;

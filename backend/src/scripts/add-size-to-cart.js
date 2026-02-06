const { sequelize } = require('../config/database');

async function addSizeToCart() {
  try {
    console.log('Adding size column to Cart table...');
    
    // Find the actual table name (Sequelize might use different casing)
    const [tableResults] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name ILIKE '%cart%'
    `);
    
    if (tableResults.length === 0) {
      console.log('⚠️  Cart table not found. It may be created automatically when the app runs.');
      return;
    }
    
    const tableName = tableResults[0].table_name;
    console.log(`Found Cart table: ${tableName}`);
    
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1
      AND column_name = 'size'
    `, {
      bind: [tableName]
    });
    
    const sizeColumnExists = results.length > 0;
    
    if (!sizeColumnExists) {
      // Add size column (use quoted identifier for case-sensitive table names)
      await sequelize.query(`
        ALTER TABLE "${tableName}" 
        ADD COLUMN "size" VARCHAR(50) NULL
      `);
      console.log('✅ Size column added to Cart table');
    } else {
      console.log('✅ Size column already exists in Cart table');
    }
    
    // Always check and fix constraints (even if column already exists)
    // Check what constraints exist
    const [constraintResults] = await sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = $1
      AND constraint_type = 'UNIQUE'
      AND constraint_name IN ('unique_user_product_cart', 'unique_user_product_size_cart')
    `, {
      bind: [tableName]
    });
    
    const existingConstraints = constraintResults.map(r => r.constraint_name);
    console.log('Existing constraints:', existingConstraints);
    
    // Drop old unique constraint if it exists (without size)
    if (existingConstraints.includes('unique_user_product_cart')) {
      try {
        await sequelize.query(`
          ALTER TABLE "${tableName}" 
          DROP CONSTRAINT "unique_user_product_cart"
        `);
        console.log('✅ Old unique constraint (unique_user_product_cart) removed');
      } catch (error) {
        console.log('⚠️  Error dropping old constraint:', error.message);
      }
    }
    
    // Add new unique constraint with size (only if it doesn't exist)
    if (!existingConstraints.includes('unique_user_product_size_cart')) {
      try {
        await sequelize.query(`
          ALTER TABLE "${tableName}" 
          ADD CONSTRAINT "unique_user_product_size_cart" 
          UNIQUE ("userId", "productId", "size")
        `);
        console.log('✅ New unique constraint added (userId, productId, size)');
      } catch (error) {
        // Check if constraint already exists (might be a race condition)
        if (error.message && error.message.includes('already exists')) {
          console.log('ℹ️  New constraint already exists');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ New unique constraint (unique_user_product_size_cart) already exists');
    }
    
    // Add comment
    await sequelize.query(`
      COMMENT ON COLUMN "${tableName}"."size" IS 'Selected size for the product (e.g., S, M, L)'
    `);
    
    console.log('✅ Column comment added');
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error adding size column to Cart:', error);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  addSizeToCart()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = addSizeToCart;

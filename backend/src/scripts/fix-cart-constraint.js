const { sequelize } = require('../config/database');

async function fixCartConstraint() {
  try {
    console.log('Fixing Cart table constraints...');
    
    // Find the actual table name
    const [tableResults] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name ILIKE '%cart%'
    `);
    
    if (tableResults.length === 0) {
      console.log('⚠️  Cart table not found.');
      return;
    }
    
    const tableName = tableResults[0].table_name;
    console.log(`Found Cart table: ${tableName}`);
    
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
    
    // Check for unique indexes (constraints are implemented as indexes in PostgreSQL)
    const [indexResults] = await sequelize.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = $1
      AND indexname IN ('unique_user_product_cart', 'unique_user_product_size_cart')
    `, {
      bind: [tableName]
    });
    
    const existingIndexes = indexResults.map(r => r.indexname);
    console.log('Existing unique indexes:', existingIndexes);
    
    // Drop old unique INDEX if it exists (without size) - ALWAYS try to drop it
    // In PostgreSQL, unique constraints are implemented as unique indexes
    try {
      await sequelize.query(`
        DROP INDEX IF EXISTS "unique_user_product_cart"
      `);
      if (existingIndexes.includes('unique_user_product_cart')) {
        console.log('✅ Dropped old unique index: unique_user_product_cart');
      } else {
        console.log('ℹ️  Old unique index (unique_user_product_cart) did not exist');
      }
    } catch (error) {
      // If index doesn't exist, that's fine
      if (error.message && error.message.includes('does not exist')) {
        console.log('ℹ️  Old unique index already removed');
      } else {
        console.error('❌ Error dropping old unique index:', error.message);
        throw error;
      }
    }
    
    // Also try dropping as constraint (in case it was created as a constraint)
    try {
      await sequelize.query(`
        ALTER TABLE "${tableName}" 
        DROP CONSTRAINT IF EXISTS "unique_user_product_cart"
      `);
      if (existingConstraints.includes('unique_user_product_cart')) {
        console.log('✅ Dropped old constraint: unique_user_product_cart');
      }
    } catch (error) {
      // Ignore if constraint doesn't exist
      if (!error.message || !error.message.includes('does not exist')) {
        console.log('ℹ️  Constraint drop attempt (may not exist):', error.message);
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
        console.log('✅ Added new constraint: unique_user_product_size_cart');
      } catch (error) {
        if (error.message && error.message.includes('already exists')) {
          console.log('ℹ️  New constraint already exists');
        } else {
          console.error('❌ Error adding new constraint:', error.message);
          throw error;
        }
      }
    } else {
      console.log('✅ New constraint (unique_user_product_size_cart) already exists');
    }
    
    console.log('🎉 Constraint fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing Cart constraints:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fixCartConstraint()
    .then(() => {
      console.log('Fix script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix script failed:', error);
      process.exit(1);
    });
}

module.exports = fixCartConstraint;

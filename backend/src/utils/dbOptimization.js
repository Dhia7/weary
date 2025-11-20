/**
 * Database optimization utilities
 * This file contains functions to optimize database performance
 */

const { sequelize } = require('../config/database');

/**
 * Create database indexes for better query performance
 */
const createIndexes = async () => {
  try {
    console.log('Creating database indexes for optimization...');
    
    // Create indexes for common query patterns
    const indexes = [
      // Product indexes
      {
        name: 'idx_products_active',
        query: 'CREATE INDEX IF NOT EXISTS idx_products_active ON "Product" ("isActive") WHERE "isActive" = true;'
      },
      {
        name: 'idx_products_sku',
        query: 'CREATE INDEX IF NOT EXISTS idx_products_sku ON "Product" ("SKU");'
      },
      {
        name: 'idx_products_slug',
        query: 'CREATE INDEX IF NOT EXISTS idx_products_slug ON "Product" ("slug");'
      },
      {
        name: 'idx_products_created_at',
        query: 'CREATE INDEX IF NOT EXISTS idx_products_created_at ON "Product" ("createdAt" DESC);'
      },
      
      // Category indexes
      {
        name: 'idx_categories_active',
        query: 'CREATE INDEX IF NOT EXISTS idx_categories_active ON "Category" ("isActive") WHERE "isActive" = true;'
      },
      {
        name: 'idx_categories_slug',
        query: 'CREATE INDEX IF NOT EXISTS idx_categories_slug ON "Category" ("slug");'
      },
      
      // Collection indexes
      {
        name: 'idx_collections_active',
        query: 'CREATE INDEX IF NOT EXISTS idx_collections_active ON "Collection" ("isActive") WHERE "isActive" = true;'
      },
      {
        name: 'idx_collections_slug',
        query: 'CREATE INDEX IF NOT EXISTS idx_collections_slug ON "Collection" ("slug");'
      },
      {
        name: 'idx_collections_sort_order',
        query: 'CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON "Collection" ("sortOrder", "name");'
      },
      
      // Junction table indexes
      {
        name: 'idx_product_category',
        query: 'CREATE INDEX IF NOT EXISTS idx_product_category ON "ProductCategory" ("productId", "categoryId");'
      },
      {
        name: 'idx_product_collection',
        query: 'CREATE INDEX IF NOT EXISTS idx_product_collection ON "ProductCollection" ("productId", "collectionId");'
      },
      {
        name: 'idx_product_collection_position',
        query: 'CREATE INDEX IF NOT EXISTS idx_product_collection_position ON "ProductCollection" ("collectionId", "position");'
      },
      
      // User indexes
      {
        name: 'idx_users_active',
        query: 'CREATE INDEX IF NOT EXISTS idx_users_active ON "User" ("isActive") WHERE "isActive" = true;'
      },
      {
        name: 'idx_users_email',
        query: 'CREATE INDEX IF NOT EXISTS idx_users_email ON "User" ("email");'
      }
    ];
    
    for (const index of indexes) {
      try {
        await sequelize.query(index.query);
        console.log(`✓ Created index: ${index.name}`);
      } catch (error) {
        console.warn(`⚠ Failed to create index ${index.name}:`, error.message);
      }
    }
    
    console.log('Database index creation completed.');
  } catch (error) {
    console.error('Error creating database indexes:', error);
    throw error;
  }
};

/**
 * Analyze database performance
 */
const analyzePerformance = async () => {
  try {
    console.log('Analyzing database performance...');
    
    // Get table sizes
    const tableSizes = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public' 
      ORDER BY tablename, attname;
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('Database statistics:');
    console.table(tableSizes.slice(0, 20)); // Show first 20 rows
    
    // Check for missing indexes on foreign keys
    const missingIndexes = await sequelize.query(`
      SELECT
        t.table_name,
        t.column_name,
        c.constraint_name
      FROM information_schema.table_constraints c
      JOIN information_schema.constraint_column_usage t 
        ON c.constraint_name = t.constraint_name
      WHERE c.constraint_type = 'FOREIGN KEY'
        AND t.table_schema = 'public'
        AND NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = t.table_name 
            AND indexdef LIKE '%' || t.column_name || '%'
        );
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (missingIndexes.length > 0) {
      console.log('⚠ Missing indexes on foreign keys:');
      console.table(missingIndexes);
    } else {
      console.log('✓ All foreign keys have indexes');
    }
    
  } catch (error) {
    console.error('Error analyzing database performance:', error);
    throw error;
  }
};

/**
 * Optimize database settings
 */
const optimizeSettings = async () => {
  try {
    console.log('Applying database optimizations...');
    
    // Set session-level optimizations
    const optimizations = [
      'SET work_mem = "64MB";',
      'SET maintenance_work_mem = "256MB";',
      'SET random_page_cost = 1.1;',
      'SET effective_cache_size = "1GB";',
      'SET checkpoint_completion_target = 0.9;',
      'SET wal_buffers = "16MB";'
    ];
    
    for (const optimization of optimizations) {
      try {
        await sequelize.query(optimization);
        console.log(`✓ Applied: ${optimization}`);
      } catch (error) {
        console.warn(`⚠ Failed to apply ${optimization}:`, error.message);
      }
    }
    
    console.log('Database optimizations completed.');
  } catch (error) {
    console.error('Error applying database optimizations:', error);
    throw error;
  }
};

module.exports = {
  createIndexes,
  analyzePerformance,
  optimizeSettings
};















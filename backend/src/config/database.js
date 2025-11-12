const { Sequelize } = require('sequelize');

// Build common Sequelize options
const commonOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 2,
    acquire: 20000, // Reduced from 30000
    idle: 10000,
    evict: 1000,
    handleDisconnects: true
  },
  dialectOptions: {
    connectTimeout: 8000, // Reduced from 10000
    statement_timeout: 20000, // Reduced from 30000 for faster failure
    idle_in_transaction_session_timeout: 20000, // Reduced from 30000
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
    application_name: 'wear-backend'
  },
  benchmark: false,
  retry: {
    max: 3,
    timeout: 3000, // Reduced from 5000 for faster retry
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ]
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  },
  queryTimeout: 20000, // Reduced from 30000
  transactionTimeout: 20000 // Reduced from 30000
};

// Optional SSL for managed Postgres providers (Render, Railway, etc.)
// Enable SSL if DB_SSL is 'true' OR if DATABASE_URL is from a remote provider
const isRemoteDatabase = process.env.DATABASE_URL && 
  (process.env.DATABASE_URL.includes('render.com') || 
   process.env.DATABASE_URL.includes('railway.app') ||
   process.env.DATABASE_URL.includes('supabase.co') ||
   process.env.DB_SSL === 'true');

if (isRemoteDatabase) {
  // Render PostgreSQL requires SSL with specific configuration
  commonOptions.dialectOptions.ssl = { 
    require: true, 
    rejectUnauthorized: false 
  };
  console.log('🔒 SSL enabled for remote database connection');
}

// Prefer single DATABASE_URL if provided (for production/Render)
let sequelize;
if (process.env.DATABASE_URL) {
  console.log('📊 Using DATABASE_URL for connection');
  console.log('🔍 Database host:', process.env.DATABASE_URL.match(/@([^:]+):/)?.[1] || 'unknown');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    ...commonOptions,
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  });
} else {
  // Use discrete fields for local development
  sequelize = new Sequelize(
    process.env.DB_NAME || 'wear_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'dhianaija123',
    {
      ...commonOptions,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432
    }
  );
}

const connectDB = async () => {
  const maxRetries = 5;
  const baseDelay = 1000; // 1 second base delay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to connect to database (attempt ${attempt}/${maxRetries})...`);
      
      // Connect to the database with timeout
      await Promise.race([
        sequelize.authenticate(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 15000)
        )
      ]);
      console.log('Connected to PostgreSQL successfully.');
      
      // Sync all models with database (without altering existing tables)
      await Promise.race([
        sequelize.sync({ alter: false }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database sync timeout')), 30000)
        )
      ]);
      console.log('Database synchronized.');
      
      // Apply database optimizations in development
      if (process.env.NODE_ENV === 'development') {
        try {
          const { createIndexes, optimizeSettings } = require('../utils/dbOptimization');
          await createIndexes();
          await optimizeSettings();
        } catch (error) {
          console.warn('Database optimization failed (non-critical):', error.message);
        }
      }
      
      return; // Success, exit the function
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error.message);
      console.error('Error details:', {
        name: error.name,
        code: error.code,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      
      // Log connection details (without password)
      if (process.env.DATABASE_URL) {
        const dbUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
        console.error('Connection URL:', dbUrl);
        console.error('SSL enabled:', isRemoteDatabase);
      }
      
      if (attempt === maxRetries) {
        console.error('All connection attempts failed. Exiting...');
        console.error('Troubleshooting tips:');
        console.error('1. Verify DATABASE_URL is correct in Render environment variables');
        console.error('2. Check PostgreSQL service is running (not suspended)');
        console.error('3. Ensure DB_SSL=true is set (or auto-detected from render.com URL)');
        console.error('4. Verify database credentials are correct');
        process.exit(1);
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s
      const retryDelay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

module.exports = { sequelize, connectDB };

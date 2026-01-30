const { Sequelize } = require('sequelize');

// Build common Sequelize options
const commonOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0, // Set to 0 for Render compatibility - prevents idle connection issues
    acquire: 30000, // Increased for Render's slower connections
    idle: 10000,
    evict: 1000,
    handleDisconnects: true
  },
  dialectOptions: {
    connectTimeout: 10000, // Increased for Render
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000, // Keep connections alive
    application_name: 'wear-backend'
  },
  benchmark: false,
  retry: {
    max: 3,
    timeout: 10000, // Increased for Render's slower connections
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
  queryTimeout: 30000, // Increased for Render - allows time for retries
  transactionTimeout: 30000 // Increased for Render - allows time for retries
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
  // Use more permissive SSL settings for Render compatibility
  commonOptions.dialectOptions.ssl = { 
    require: true,
    rejectUnauthorized: false
  };
  // Additional connection options for Render
  commonOptions.dialectOptions.keepAlive = true;
  commonOptions.dialectOptions.keepAliveInitialDelayMillis = 10000;
  console.log('🔒 SSL enabled for remote database connection');
  console.log('🔒 SSL config:', JSON.stringify(commonOptions.dialectOptions.ssl));
}

// Prefer single DATABASE_URL if provided (for production/Render)
let sequelize;
if (process.env.DATABASE_URL) {
  console.log('📊 Using DATABASE_URL for connection');
  // Extract hostname - handle URLs with or without port
  const hostMatch = process.env.DATABASE_URL.match(/@([^:/]+)(?::(\d+))?/);
  const dbHost = hostMatch?.[1] || 'unknown';
  const dbPort = hostMatch?.[2] || '5432';
  console.log('🔍 Database host:', dbHost);
  console.log('🔍 Database port:', dbPort);
  
  // Warn if hostname looks incomplete (missing domain suffix)
  if (dbHost && !dbHost.includes('.') && dbHost.startsWith('dpg-')) {
    console.warn('⚠️  Warning: Hostname appears incomplete. Render PostgreSQL URLs should include domain (e.g., dpg-xxxxx-a.frankfurt-postgres.render.com)');
    console.warn('⚠️  Please verify DATABASE_URL in Render dashboard includes the full hostname');
  }
  
  // For Render, ensure we're using the correct connection string format
  let connectionString = process.env.DATABASE_URL;
  
  // If it's a postgres:// URL, convert to postgresql:// for better compatibility
  if (connectionString.startsWith('postgres://')) {
    connectionString = connectionString.replace('postgres://', 'postgresql://');
    console.log('🔄 Converted postgres:// to postgresql:// for compatibility');
  }
  
  // If URL is missing port, add default PostgreSQL port (5432)
  // Format: postgresql://user:pass@host/dbname -> postgresql://user:pass@host:5432/dbname
  if (connectionString.match(/@[^:/]+(\/|$)/) && !connectionString.match(/@[^:]+:\d+/)) {
    connectionString = connectionString.replace(/@([^/]+)\//, '@$1:5432/');
    console.log('🔄 Added default port 5432 to connection string');
  }
  
  sequelize = new Sequelize(connectionString, {
    ...commonOptions,
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    // Ensure dialect is explicitly set
    dialect: 'postgres'
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
      
      // Auto-create admin account from environment variables (if configured)
      try {
        const { autoCreateAdmin } = require('../utils/autoCreateAdmin');
        await autoCreateAdmin();
      } catch (error) {
        console.warn('Admin auto-creation failed (non-critical):', error.message);
      }
      
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
      // Extract more meaningful error message
      let errorMessage = error.message;
      if (error.name === 'TimeoutError' || error.message.includes('timeout') || error.message.includes('timed out')) {
        errorMessage = `Connection timeout after 15 seconds - this is common with remote databases. Retrying...`;
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = `Connection refused - database may be down or unreachable`;
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        // Extract hostname from DATABASE_URL for better diagnostics (handle URLs with or without port)
        let hostname = 'unknown';
        if (process.env.DATABASE_URL) {
          const match = process.env.DATABASE_URL.match(/@([^:/]+)/);
          if (match) hostname = match[1];
        }
        errorMessage = `DNS resolution failed - cannot resolve hostname "${hostname}". The database may have been deleted or suspended. Please create a new database and update DATABASE_URL.`;
      } else if (error.message.includes('authentication')) {
        errorMessage = `Authentication failed - check database credentials`;
      } else if (error.message.includes('Connection terminated') || error.message.includes('terminated unexpectedly') || error.message.includes('ECONNRESET')) {
        errorMessage = `Connection terminated unexpectedly - database may have closed the connection. This is common with Render PostgreSQL. Retrying...`;
      }
      
      console.error(`Database connection attempt ${attempt} failed: ${errorMessage}`);
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error details:', {
          name: error.name,
          code: error.code,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
      }
      
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
        console.error('3. If DNS resolution failed, the database may have been deleted - create a new PostgreSQL database');
        console.error('4. Ensure DB_SSL=true is set (or auto-detected from render.com URL)');
        console.error('5. Verify database credentials are correct');
        console.error('');
        console.error('💡 Quick Fix: Create a new PostgreSQL database on Render and update DATABASE_URL');
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

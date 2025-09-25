const { Sequelize } = require('sequelize');

// Connect directly to PostgreSQL with optimized timeout settings
const sequelize = new Sequelize(
  process.env.DB_NAME || 'wear_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'dhianaija123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10, // Increased for better concurrency
      min: 2, // Increased minimum connections
      acquire: 30000, // Reduced acquire timeout to fail faster
      idle: 10000, // Reduced idle timeout
      evict: 1000, // Check for idle connections every second
      handleDisconnects: true
    },
    // Connection configurations
    dialectOptions: {
      // Connection timeout
      connectTimeout: 10000, // Reduced connection timeout to fail faster
      // Statement timeout
      statement_timeout: 30000, // Reduced statement timeout
      // Idle timeout
      idle_in_transaction_session_timeout: 30000,
      // Additional options for better connection handling
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
      // Connection validation
      application_name: 'wear-backend'
    },
    // Disable query logging for better performance
    benchmark: false,
    // Retry configuration with exponential backoff
    retry: {
      max: 3, // Reduced retry attempts
      timeout: 5000, // Increased retry timeout
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
    // Additional options
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    // Query timeout
    queryTimeout: 30000,
    // Transaction timeout
    transactionTimeout: 30000
  }
);

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
      return; // Success, exit the function
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('All connection attempts failed. Exiting...');
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

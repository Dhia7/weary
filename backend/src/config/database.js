const { Sequelize } = require('sequelize');

// Build common Sequelize options
const commonOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
    evict: 1000,
    handleDisconnects: true
  },
  dialectOptions: {
    connectTimeout: 10000,
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
    application_name: 'wear-backend'
  },
  benchmark: false,
  retry: {
    max: 3,
    timeout: 5000,
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
  queryTimeout: 30000,
  transactionTimeout: 30000
};

// Optional SSL for managed Postgres providers
if (process.env.DB_SSL === 'true') {
  commonOptions.dialectOptions.ssl = { require: true, rejectUnauthorized: false };
}

// Prefer single DATABASE_URL if provided
let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    ...commonOptions,
    protocol: 'postgres'
  });
} else {
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

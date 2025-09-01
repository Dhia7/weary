const { Sequelize } = require('sequelize');

// Connect directly to PostgreSQL (or through PgBouncer if configured)
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
      max: 10, // Increased for PgBouncer
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    // Connection configurations
    dialectOptions: {
      // Connection timeout
      connectTimeout: 60000,
      // Statement timeout
      statement_timeout: 30000,
      // Idle timeout
      idle_in_transaction_session_timeout: 30000
    },
    // Disable query logging for better performance
    benchmark: false,
    // Retry configuration
    retry: {
      max: 3,
      timeout: 1000
    }
  }
);

const connectDB = async () => {
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to connect to database (attempt ${attempt}/${maxRetries})...`);
      
      // Connect to the database
      await sequelize.authenticate();
      console.log('Connected to PostgreSQL successfully.');
      
      // Sync all models with database
      await sequelize.sync({ alter: true });
      console.log('Database synchronized.');
      return; // Success, exit the function
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('All connection attempts failed. Exiting...');
        process.exit(1);
      }
      
      console.log(`Retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

module.exports = { sequelize, connectDB };

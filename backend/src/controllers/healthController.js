const { sequelize } = require('../config/database');
const dbMonitor = require('../utils/dbMonitor');
const { withTimeout, TIMEOUTS } = require('../utils/queryTimeout');

// Health check endpoint
const healthCheck = async (req, res) => {
  try {
    // Use the database monitor for health check
    const dbStatus = await dbMonitor.checkHealth();
    
    if (dbStatus.status === 'healthy') {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          responseTime: dbStatus.responseTime
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        },
        monitor: dbMonitor.getStatus()
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: dbStatus.error,
          retryCount: dbStatus.retryCount
        },
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        },
        monitor: dbMonitor.getStatus()
      });
    }
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: error.message
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      },
      monitor: dbMonitor.getStatus()
    });
  }
};

// Database connection status
const dbStatus = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connection with timeout
    await withTimeout(
      sequelize.authenticate(),
      TIMEOUTS.SIMPLE_QUERY,
      'Database health check'
    );
    
    const responseTime = Date.now() - startTime;
    
    // Get connection pool info
    const pool = sequelize.connectionManager.pool;
    const poolInfo = {
      totalConnections: pool.size,
      usedConnections: pool.used,
      idleConnections: pool.pending,
      waitingConnections: pool.pending
    };
    
    res.json({
      success: true,
      status: 'connected',
      responseTime: `${responseTime}ms`,
      pool: poolInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database status check error:', error);
    
    // Provide more specific error message for timeouts
    const errorMessage = error.message && error.message.includes('timeout') 
      ? `Database connection timeout: ${error.message}`
      : error.message;
    
    res.status(503).json({
      success: false,
      status: 'disconnected',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  healthCheck,
  dbStatus
};

const { sequelize } = require('../config/database');

class DatabaseMonitor {
  constructor() {
    this.isHealthy = true;
    this.lastCheck = null;
    this.checkInterval = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async checkHealth() {
    try {
      const startTime = Date.now();
      
      await Promise.race([
        sequelize.authenticate(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 20000)
        )
      ]);
      
      const responseTime = Date.now() - startTime;
      this.isHealthy = true;
      this.retryCount = 0;
      this.lastCheck = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        responseTime: `${responseTime}ms`
      };
      
      return this.lastCheck;
    } catch (error) {
      this.retryCount++;
      this.isHealthy = false;
      this.lastCheck = {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message,
        retryCount: this.retryCount
      };
      
      console.error('Database health check failed:', error.message);
      return this.lastCheck;
    }
  }

  startMonitoring(intervalMs = 30000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(async () => {
      await this.checkHealth();
    }, intervalMs);
    
    console.log(`Database monitoring started (checking every ${intervalMs/1000}s)`);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Database monitoring stopped');
    }
  }

  getStatus() {
    return {
      isHealthy: this.isHealthy,
      lastCheck: this.lastCheck,
      retryCount: this.retryCount
    };
  }

  async forceReconnect() {
    try {
      console.log('Attempting to reconnect to database...');
      await sequelize.close();
      await sequelize.authenticate();
      console.log('Database reconnected successfully');
      return true;
    } catch (error) {
      console.error('Database reconnection failed:', error.message);
      return false;
    }
  }
}

// Create singleton instance
const dbMonitor = new DatabaseMonitor();

module.exports = dbMonitor;

/**
 * Utility function for adding timeout protection to database queries
 * @param {Promise} queryPromise - The database query promise
 * @param {number} timeoutMs - Timeout in milliseconds (default: 15000)
 * @param {string} operationName - Name of the operation for error messages
 * @returns {Promise} - Promise that races between query and timeout
 */
const withTimeout = (queryPromise, timeoutMs = 15000, operationName = 'Database query') => {
  return Promise.race([
    queryPromise.catch(error => {
      // Re-throw with more context if it's a timeout
      if (error.message && error.message.includes('timeout')) {
        throw new Error(`${operationName} timeout: ${error.message}`);
      }
      throw error;
    }),
    new Promise((_, reject) => 
      setTimeout(() => {
        const timeoutError = new Error(`${operationName} timeout after ${timeoutMs}ms`);
        timeoutError.name = 'TimeoutError';
        reject(timeoutError);
      }, timeoutMs)
    )
  ]);
};

/**
 * Standard timeout configurations for different operations
 * Increased for Render's slower database connections
 */
const TIMEOUTS = {
  AUTH: 15000,          // Authentication queries (increased for Render)
  SIMPLE_QUERY: 20000,  // Simple single table queries (increased for Render)
  COMPLEX_QUERY: 30000, // Complex queries with joins (increased for Render)
  BULK_OPERATION: 60000 // Bulk operations like sync (increased for Render)
};

/**
 * Handle timeout errors consistently
 * @param {Error} error - The error object
 * @param {Object} res - Express response object
 * @param {string} operationName - Name of the operation for logging
 */
const handleTimeoutError = (error, res, operationName = 'Operation') => {
  console.error(`${operationName} error:`, error);
  
  if (error.message.includes('timeout')) {
    return res.status(408).json({ 
      success: false, 
      message: 'Request timeout - please try again' 
    });
  } else {
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

module.exports = {
  withTimeout,
  TIMEOUTS,
  handleTimeoutError
};
















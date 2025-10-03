/**
 * Utility function for adding timeout protection to database queries
 * @param {Promise} queryPromise - The database query promise
 * @param {number} timeoutMs - Timeout in milliseconds (default: 15000)
 * @param {string} operationName - Name of the operation for error messages
 * @returns {Promise} - Promise that races between query and timeout
 */
const withTimeout = (queryPromise, timeoutMs = 15000, operationName = 'Database query') => {
  return Promise.race([
    queryPromise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${operationName} timeout`)), timeoutMs)
    )
  ]);
};

/**
 * Standard timeout configurations for different operations
 */
const TIMEOUTS = {
  AUTH: 5000,           // Authentication queries (fast)
  SIMPLE_QUERY: 8000,   // Simple single table queries
  COMPLEX_QUERY: 15000, // Complex queries with joins
  BULK_OPERATION: 30000 // Bulk operations like sync
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

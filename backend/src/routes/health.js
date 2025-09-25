const express = require('express');
const router = express.Router();
const { healthCheck, dbStatus } = require('../controllers/healthController');

// Health check routes
router.get('/', healthCheck);
router.get('/db', dbStatus);

module.exports = router;

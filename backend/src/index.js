const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/database');
const dbMonitor = require('./utils/dbMonitor');

// Import models to ensure they are registered
require('./models/User');
require('./models/Address');
require('./models/Product');
require('./models/Category');
require('./models/ProductCategory');
require('./models/Collection');
require('./models/ProductCollection');
require('./models/Order');
require('./models/OrderItem');
require('./models/Cart');
require('./models/Wishlist');

// Import associations
require('./models/associations');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products');
const collectionRoutes = require('./routes/collections');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const healthRoutes = require('./routes/health');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:3000", "https://localhost:3000", "http://localhost:5000", "https://localhost:5000", "http://localhost:3001", "https://localhost:3001"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "http://localhost:3000", "https://localhost:3000", "http://localhost:5000", "https://localhost:5000", "http://localhost:3001", "https://localhost:3001"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting (skip preflight OPTIONS) - Temporarily disabled for development
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: {
//     success: false,
//     message: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => req.method === 'OPTIONS'
// });
// app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Explicitly handle preflight requests
app.options('*', cors(corsOptions));

// Serve static files (uploads) - after CORS configuration
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Direct file server to handle edge cases (Windows paths, uppercase extensions)
app.get('/uploads/:filename', (req, res, next) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      return next();
    }
    res.type(path.extname(filePath) || 'application/octet-stream');
    return res.sendFile(filePath);
  } catch (e) {
    return next();
  }
});

app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, path) => {
    // Set proper headers for images
    if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif') || path.endsWith('.webp')) {
      const ext = path.split('.').pop();
      const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
  }
}));

// Health check routes
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => error.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path;
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Timeout errors
  if (err.message && err.message.includes('timeout')) {
    return res.status(408).json({
      success: false,
      message: 'Request timeout - please try again'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001; // Backend runs on port 3001

// SSL certificate paths
const sslDir = path.join(__dirname, '..', '..', 'ssl');
const sslKeyPath = path.join(sslDir, 'server.key');
const sslCertPath = path.join(sslDir, 'server.crt');

// Check if SSL certificates exist
const useHTTPS = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

if (useHTTPS) {
  // HTTPS Server
  const httpsOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath)
  };

  const httpsServer = https.createServer(httpsOptions, app);
  
  httpsServer.listen(PORT, () => {
    console.log(`🔒 HTTPS Server running on port ${PORT}`);
    console.log(`🌐 Access your API at: https://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⚠️  Note: Self-signed certificate - browser will show security warning`);
    
    // Start database monitoring
    dbMonitor.startMonitoring(30000); // Check every 30 seconds
  });
} else {
  // HTTP Server (fallback)
  console.log('⚠️  SSL certificates not found, running HTTP server');
  console.log('💡 Run "node scripts/generate-ssl.js" to generate SSL certificates');
  
  app.listen(PORT, () => {
    console.log(`🌐 HTTP Server running on port ${PORT}`);
    console.log(`🌐 Access your API at: http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Start database monitoring
    dbMonitor.startMonitoring(30000); // Check every 30 seconds
  });
}

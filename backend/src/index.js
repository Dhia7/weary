const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// NOTE: This application only creates HTTP servers
// SSL/HTTPS is handled by the deployment platform (Render) at the load balancer level
require('dotenv').config();

// Explicitly prevent HTTPS server creation in production
if (process.env.NODE_ENV === 'production') {
  // Override any SSL-related environment variables that might trigger HTTPS
  delete process.env.SSL_CERT;
  delete process.env.SSL_KEY;
  delete process.env.SSL_CA;
  delete process.env.HTTPS_PORT;
  delete process.env.SSL_PORT;
}

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
const categoryRoutes = require('./routes/categories');
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
      imgSrc: [
        "'self'", 
        "data:", 
        "http://localhost:3000", 
        "https://localhost:3000", 
        "http://localhost:5000", 
        "https://localhost:5000", 
        "http://localhost:3001", 
        "https://localhost:3001", 
        "https://weary-iota.vercel.app", 
        "https://weary-git-main-dhia7s-projects.vercel.app", 
        "https://weary-kndtv5wjk-dhia7s-projects.vercel.app",
        // Allow images from any Vercel subdomain
        "https://*.vercel.app",
        // Allow images from the backend domain itself
        process.env.BACKEND_URL || "http://localhost:3001"
      ],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: [
        "'self'", 
        "http://localhost:3000", 
        "https://localhost:3000", 
        "http://localhost:5000", 
        "https://localhost:5000", 
        "http://localhost:3001", 
        "https://localhost:3001", 
        "https://weary-iota.vercel.app", 
        "https://weary-git-main-dhia7s-projects.vercel.app", 
        "https://weary-kndtv5wjk-dhia7s-projects.vercel.app",
        // Allow connections to any Vercel subdomain
        "https://*.vercel.app"
      ],
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
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3001',
    // Vercel deployment domains
    'https://weary-iota.vercel.app',
    'https://weary-git-main-dhia7s-projects.vercel.app',
    'https://weary-kndtv5wjk-dhia7s-projects.vercel.app',
    // Allow any Vercel subdomain for your project
    /^https:\/\/weary-.*\.vercel\.app$/,
    /^https:\/\/.*\.vercel\.app$/
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
    let filePath = path.join(uploadsDir, filename);

    // If the exact file doesn't exist, try common alternate extensions
    if (!fs.existsSync(filePath)) {
      const requestedExt = path.extname(filename).toLowerCase();
      const baseName = filename.slice(0, -requestedExt.length);
      // Priority order of extensions to try
      const alternateExtensions = requestedExt === '.jpg' || requestedExt === '.jpeg'
        ? ['.jpg', '.jpeg', '.jfif', '.png', '.webp']
        : requestedExt === '.jfif'
          ? ['.jfif', '.jpg', '.jpeg', '.png', '.webp']
          : requestedExt === '.png'
            ? ['.png', '.jpg', '.jpeg', '.jfif', '.webp']
            : requestedExt === '.webp'
              ? ['.webp', '.jpg', '.jpeg', '.jfif', '.png']
              : ['.jpg', '.jpeg', '.jfif', '.png', '.webp'];

      for (const ext of alternateExtensions) {
        const candidatePath = path.join(uploadsDir, `${baseName}${ext}`);
        if (fs.existsSync(candidatePath)) {
          filePath = candidatePath;
          break;
        }
      }
    }

    if (!fs.existsSync(filePath)) {
      return next();
    }

    const ext = path.extname(filePath).toLowerCase();
    // Treat .jfif as image/jpeg for widest compatibility
    const contentType = (ext === '.jpg' || ext === '.jpeg' || ext === '.jfif')
      ? 'image/jpeg'
      : ext === '.png'
        ? 'image/png'
        : ext === '.gif'
          ? 'image/gif'
          : ext === '.webp'
            ? 'image/webp'
            : 'application/octet-stream';

    res.type(contentType);
    return res.sendFile(filePath);
  } catch (e) {
    return next();
  }
});

app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    // Set proper headers for images (treat .jfif as JPEG)
    const lower = filePath.toLowerCase();
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp') || lower.endsWith('.jfif')) {
      const ext = lower.split('.').pop();
      const contentType = (ext === 'jpg' || ext === 'jpeg' || ext === 'jfif')
        ? 'image/jpeg'
        : ext === 'png'
          ? 'image/png'
          : ext === 'gif'
            ? 'image/gif'
            : ext === 'webp'
              ? 'image/webp'
              : 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Vary', 'Origin');
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
app.use('/api/categories', categoryRoutes);
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

// Ensure we only run HTTP server (Render handles SSL termination)
// Never attempt to create HTTPS server in production
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Starting in production mode - HTTP only (SSL handled by Render)');
}

// HTTP Server only
const server = app.listen(PORT, () => {
  console.log(`🌐 HTTP Server running on port ${PORT}`);
  console.log(`🌐 Access your API at: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server type: HTTP only (no SSL/TLS)`);
  
  // Start database monitoring
  dbMonitor.startMonitoring(30000); // Check every 30 seconds
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

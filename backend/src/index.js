const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');

// #region agent log
const __dbg = (hypothesisId, location, message, data = {}) => {
  const payload = {
    sessionId: '431924',
    runId: process.env.DEBUG_RUN_ID || 'render-boot',
    hypothesisId,
    location,
    message,
    data: { ...data, pid: process.pid, nodeEnv: process.env.NODE_ENV || null },
    timestamp: Date.now(),
  };
  try {
    process.stdout.write(`[DBG431924] ${JSON.stringify(payload)}\n`);
  } catch (_) {}
  try {
    fs.appendFileSync(path.join(__dirname, '..', '..', 'debug-431924.log'), `${JSON.stringify(payload)}\n`);
  } catch (_) {}
  try {
    fetch('http://127.0.0.1:7792/ingest/35887cb5-8492-4e17-ab7a-ba1c43c91d05', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '431924' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (_) {}
};
__dbg('A', 'index.js:boot', 'index.js entered before heavy requires', {
  cwd: process.cwd(),
  portEnv: process.env.PORT || null,
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  hasJwt: Boolean(process.env.JWT_SECRET),
  hasRedis: Boolean(process.env.REDIS_URL),
});
// #endregion

const { globalLimiter, isRateLimitEnabled } = require('./middleware/rateLimit');
const { csrfProtection } = require('./middleware/csrf');

// #region agent log
__dbg('B', 'index.js:after-rateLimit', 'rateLimit + csrf modules loaded', {
  rateLimitEnabled: typeof isRateLimitEnabled === 'function' ? isRateLimitEnabled() : isRateLimitEnabled,
});
// #endregion

// NOTE: This application only creates HTTP servers
// SSL/HTTPS is handled by the deployment platform (Render) at the load balancer level
require('dotenv').config();

const { assertJwtConfigured } = require('./utils/jwt');

try {
  assertJwtConfigured();
  // #region agent log
  __dbg('A', 'index.js:jwt-ok', 'JWT assert passed');
  // #endregion
} catch (error) {
  console.error(`❌ ${error.message}`);
  // #region agent log
  __dbg('A', 'index.js:jwt-fail', 'JWT assert failed — exiting', { error: error.message });
  // #endregion
  process.exit(1);
}

// Explicitly prevent HTTPS server creation in production
if (process.env.NODE_ENV === 'production') {
  // Override any SSL-related environment variables that might trigger HTTPS
  delete process.env.SSL_CERT;
  delete process.env.SSL_KEY;
  delete process.env.SSL_CA;
  delete process.env.HTTPS_PORT;
  delete process.env.SSL_PORT;
}

const { connectDB } = require('./config/database');
const dbMonitor = require('./utils/dbMonitor');

// #region agent log
__dbg('A', 'index.js:pre-models', 'about to require models/routes');
// #endregion

// Import models to ensure they are registered
require('./models/User');
require('./models/Address');
require('./models/Product');
require('./models/ProductVariant');
require('./models/Category');
require('./models/ProductCategory');
require('./models/Collection');
require('./models/ProductCollection');
require('./models/Order');
require('./models/OrderItem');
require('./models/Cart');
require('./models/Wishlist');
require('./models/ContactMessage');
require('./models/CodBlocklist');
require('./models/StockWaitlist');

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
const orderRoutes = require('./routes/orders');
const translateRoutes = require('./routes/translate');
const contactRoutes = require('./routes/contact');
const healthRoutes = require('./routes/health');

// #region agent log
__dbg('A', 'index.js:post-models', 'models/routes required successfully');
// #endregion

const app = express();

// Render sits behind a reverse proxy; trust the first proxy hop in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Connect to database, then start pending-order sweeper only after success
connectDB().then(() => {
  try {
    const { startPendingOrderSweeper } = require('./utils/pendingOrderSweeper');
    startPendingOrderSweeper();
  } catch (err) {
    console.warn('Pending order sweeper failed to start:', err.message || err);
  }
}).catch((err) => {
  console.error('connectDB failed:', err.message || err);
});

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

// Global API rate limiting (route-specific limiters applied in route modules)
if (isRateLimitEnabled()) {
  app.use('/api/', globalLimiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Enable ETags for better caching
app.set('etag', 'strong');

// CORS configuration
const allowedOrigins = new Set([
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
  // Website domains
  'https://www.swisia.store',
  'https://swisia.store'
]);

const vercelOriginPattern = /^https:\/\/([a-z0-9-]+\.)?vercel\.app$/i;
const projectVercelPattern = /^https:\/\/weary-.*\.vercel\.app$/i;
// Local dev: localhost, 127.0.0.1, and LAN IPs (e.g. http://192.168.x.x:3000)
const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/i;

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return (
    allowedOrigins.has(origin) ||
    vercelOriginPattern.test(origin) ||
    projectVercelPattern.test(origin) ||
    localDevOriginPattern.test(origin)
  );
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  optionsSuccessStatus: 204
};

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  if (isAllowedOrigin(requestOrigin) && requestOrigin) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

app.use(cors(corsOptions));

// Double-submit CSRF for mutating API requests (after cookies are parsed)
app.use('/api', csrfProtection);

// Serve static files (uploads) - after CORS configuration
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const uploadsDirPrefix = uploadsDir.endsWith(path.sep) ? uploadsDir : uploadsDir + path.sep;

const isPathInsideUploads = (resolvedPath) => {
  const normalized = path.resolve(resolvedPath);
  return normalized === uploadsDir || normalized.startsWith(uploadsDirPrefix);
};

const isSafeUploadFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return false;
  if (filename.includes('..') || path.isAbsolute(filename)) return false;
  // Reject path separators (Unix and Windows) so resolve cannot escape uploadsDir
  if (filename.includes('/') || filename.includes('\\') || filename.includes('\0')) return false;
  return true;
};

// Direct file server to handle edge cases (Windows paths, uppercase extensions)
app.get('/uploads/:filename', (req, res, next) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    if (!isSafeUploadFilename(filename)) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    let filePath = path.resolve(uploadsDir, filename);
    if (!isPathInsideUploads(filePath)) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    // If the exact file doesn't exist, try common alternate extensions
    if (!fs.existsSync(filePath)) {
      const requestedExt = path.extname(filename).toLowerCase();
      const baseName = filename.slice(0, -requestedExt.length || filename.length);
      if (!isSafeUploadFilename(`${baseName}.jpg`)) {
        return res.status(400).json({ success: false, message: 'Invalid filename' });
      }
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
        const candidatePath = path.resolve(uploadsDir, `${baseName}${ext}`);
        if (!isPathInsideUploads(candidatePath)) continue;
        if (fs.existsSync(candidatePath)) {
          filePath = candidatePath;
          break;
        }
      }
    }

    if (!isPathInsideUploads(filePath) || !fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const ext = path.extname(filePath).toLowerCase();
    // Treat .jfif as image/jpeg for widest compatibility; unknown types stay octet-stream
    const allowlistedInline = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.jfif': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    const contentType = allowlistedInline[ext] || 'application/octet-stream';

    res.type(contentType);
    if (allowlistedInline[ext]) {
      res.setHeader('Content-Disposition', 'inline');
    } else {
      res.setHeader('Content-Disposition', 'attachment');
    }
    return res.sendFile(filePath);
  } catch (e) {
    console.error('Error serving file:', e);
    return res.status(500).json({ success: false, message: 'Error serving image' });
  }
});

app.use('/uploads', express.static(uploadsDir, {
  index: false,
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
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    } else {
      res.setHeader('Content-Disposition', 'attachment');
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
app.use('/api/orders', orderRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/contact', contactRoutes);

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
const HOST = process.env.HOST || '0.0.0.0';

// #region agent log
__dbg('D', 'index.js:pre-listen', 'about to call app.listen', {
  port: String(PORT),
  host: HOST,
  portFromEnv: Boolean(process.env.PORT),
});
// #endregion

// Ensure we only run HTTP server (Render handles SSL termination)
// Never attempt to create HTTPS server in production
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Starting in production mode - HTTP only (SSL handled by Render)');
}

// HTTP Server only — bind 0.0.0.0 so Render port scan can detect the service
const server = app.listen(PORT, HOST, () => {
  // #region agent log
  const addr = server.address();
  __dbg('C', 'index.js:listen-ok', 'app.listen callback fired', {
    address: addr && typeof addr === 'object' ? addr : { raw: addr },
  });
  // #endregion
  console.log(`🌐 HTTP Server running on ${HOST}:${PORT}`);
  console.log(`🌐 Access your API at: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server type: HTTP only (no SSL/TLS)`);
  
  // Start database monitoring
  dbMonitor.startMonitoring(30000); // Check every 30 seconds
});

server.on('error', (err) => {
  // #region agent log
  __dbg('C', 'index.js:listen-error', 'app.listen error', {
    code: err.code,
    message: err.message,
  });
  // #endregion
  console.error('HTTP server error:', err);
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

const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// SSL certificate paths
const sslDir = path.join(__dirname, '..', 'ssl');
const sslKeyPath = path.join(sslDir, 'server.key');
const sslCertPath = path.join(sslDir, 'server.crt');

// Check if SSL certificates exist
const useHTTPS = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  if (useHTTPS) {
    // HTTPS Server
    const httpsOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };

    createServer(httpsOptions, async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`🔒 HTTPS Server ready on https://${hostname}:${port}`);
      console.log(`⚠️  Note: Self-signed certificate - browser will show security warning`);
      console.log(`   Click "Advanced" and "Proceed to localhost" to continue`);
    });
  } else {
    console.log('⚠️  SSL certificates not found, please generate them first');
    console.log('💡 Run the SSL generation script from the root directory');
    process.exit(1);
  }
});

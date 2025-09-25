const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sslDir = path.join(__dirname, '..', 'ssl');

// Create ssl directory if it doesn't exist
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

console.log('🔐 Generating SSL certificates for HTTPS development...');

try {
  // Generate private key
  console.log('📝 Generating private key...');
  execSync(`openssl genrsa -out ${path.join(sslDir, 'server.key')} 2048`, { stdio: 'inherit' });

  // Generate certificate signing request
  console.log('📝 Generating certificate signing request...');
  execSync(`openssl req -new -key ${path.join(sslDir, 'server.key')} -out ${path.join(sslDir, 'server.csr')} -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });

  // Generate self-signed certificate
  console.log('📝 Generating self-signed certificate...');
  execSync(`openssl x509 -req -days 365 -in ${path.join(sslDir, 'server.csr')} -signkey ${path.join(sslDir, 'server.key')} -out ${path.join(sslDir, 'server.crt')}`, { stdio: 'inherit' });

  // Clean up CSR file
  fs.unlinkSync(path.join(sslDir, 'server.csr'));

  console.log('✅ SSL certificates generated successfully!');
  console.log(`📁 Certificates saved in: ${sslDir}`);
  console.log('🔒 Files created:');
  console.log('   - server.key (private key)');
  console.log('   - server.crt (certificate)');
  console.log('');
  console.log('⚠️  Note: These are self-signed certificates for development only.');
  console.log('   Your browser will show a security warning - click "Advanced" and "Proceed to localhost"');

} catch (error) {
  console.error('❌ Error generating SSL certificates:', error.message);
  console.log('');
  console.log('💡 Make sure OpenSSL is installed on your system:');
  console.log('   - Windows: Install Git Bash or use Windows Subsystem for Linux');
  console.log('   - macOS: Install with "brew install openssl"');
  console.log('   - Linux: Install with "sudo apt-get install openssl"');
}

const fs = require('fs');
const path = require('path');

console.log('🔒 Setting up HTTPS for Wear project...\n');

// Check if SSL certificates exist
const sslDir = path.join(__dirname, '..', 'ssl');
const sslKeyPath = path.join(sslDir, 'server.key');
const sslCertPath = path.join(sslDir, 'server.crt');

const hasCertificates = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

if (!hasCertificates) {
  console.log('❌ SSL certificates not found!');
  console.log('💡 Please run the SSL generation script first:');
  console.log('   node scripts/generate-ssl.js\n');
  process.exit(1);
}

console.log('✅ SSL certificates found!');

// Update frontend .env.local if it exists
const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env.local');
const frontendEnvContent = `# HTTPS Configuration
NEXT_PUBLIC_API_URL=https://localhost:3001/api
BACKEND_PROTOCOL=https
`;

if (fs.existsSync(frontendEnvPath)) {
  console.log('📝 Updating frontend .env.local for HTTPS...');
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
} else {
  console.log('📝 Creating frontend .env.local for HTTPS...');
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
}

// Update backend .env if it exists
const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
const backendEnvContent = `# HTTPS Configuration
FRONTEND_URL=https://localhost:3000
`;

if (fs.existsSync(backendEnvPath)) {
  console.log('📝 Updating backend .env for HTTPS...');
  const existingContent = fs.readFileSync(backendEnvPath, 'utf8');
  
  // Replace FRONTEND_URL if it exists, otherwise append
  if (existingContent.includes('FRONTEND_URL=')) {
    const updatedContent = existingContent.replace(
      /FRONTEND_URL=.*/g,
      'FRONTEND_URL=https://localhost:3000'
    );
    fs.writeFileSync(backendEnvPath, updatedContent);
  } else {
    fs.appendFileSync(backendEnvPath, '\n' + backendEnvContent);
  }
} else {
  console.log('📝 Creating backend .env for HTTPS...');
  fs.writeFileSync(backendEnvPath, backendEnvContent);
}

console.log('\n✅ HTTPS setup complete!');
console.log('\n🚀 To start your application with HTTPS:');
console.log('\n1. Start the backend (in one terminal):');
console.log('   cd backend');
console.log('   npm run dev');
console.log('\n2. Start the frontend (in another terminal):');
console.log('   cd frontend');
console.log('   npm run dev:https');
console.log('\n3. Access your application:');
console.log('   Frontend: https://localhost:3000');
console.log('   Backend:  https://localhost:3001');
console.log('\n⚠️  Note: Your browser will show a security warning for self-signed certificates.');
console.log('   Click "Advanced" and "Proceed to localhost" to continue.');
console.log('\n🔄 To switch back to HTTP:');
console.log('   1. Delete .env.local in frontend directory');
console.log('   2. Update .env in backend directory to use http://localhost:3000');

const https = require('https');
const fs = require('fs');

console.log('🧪 Testing HTTPS connection...\n');

// Test backend HTTPS
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/health',
  method: 'GET',
  rejectUnauthorized: false // Allow self-signed certificates
};

const req = https.request(options, (res) => {
  console.log(`✅ Backend HTTPS Status: ${res.statusCode}`);
  console.log(`✅ Backend HTTPS Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`✅ Backend Response:`, data);
    console.log('\n🎉 HTTPS is working correctly!');
    console.log('\n📝 Next steps:');
    console.log('1. Start the frontend: cd frontend && npm run dev:https');
    console.log('2. Open https://localhost:3000 in your browser');
    console.log('3. Accept the security warning for self-signed certificate');
  });
});

req.on('error', (err) => {
  console.error('❌ HTTPS Test Failed:', err.message);
  console.log('\n💡 Troubleshooting:');
  console.log('1. Make sure backend is running: cd backend && npm run dev');
  console.log('2. Check if SSL certificates exist in ssl/ directory');
  console.log('3. Verify the backend is configured for HTTPS');
});

req.end();

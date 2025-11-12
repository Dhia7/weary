/**
 * Quick test script to verify Render deployment
 * Usage: node test-render.js <your-render-url>
 * Example: node test-render.js https://weary-backend.onrender.com
 */

const https = require('https');
const http = require('http');

const renderUrl = process.argv[2] || 'https://weary-backend.onrender.com';

console.log('🔍 Testing Render Deployment...\n');
console.log(`📍 Backend URL: ${renderUrl}\n`);

const tests = [
  {
    name: 'Health Check',
    path: '/health',
    expectedStatus: 200
  },
  {
    name: 'Database Status',
    path: '/health/db',
    expectedStatus: 200
  },
  {
    name: 'Products API',
    path: '/api/products',
    expectedStatus: 200
  }
];

function makeRequest(url, path) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${url}${path}`;
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(fullUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      const result = await makeRequest(renderUrl, test.path);
      
      if (result.status === test.expectedStatus) {
        console.log(`  ✅ PASSED - Status: ${result.status}`);
        
        // Show relevant data
        if (test.path === '/health') {
          console.log(`     Status: ${result.data.status || 'N/A'}`);
          if (result.data.database) {
            console.log(`     Database: ${result.data.database.status || 'N/A'}`);
          }
        } else if (test.path === '/health/db') {
          console.log(`     Database Status: ${result.data.status || 'N/A'}`);
        } else if (test.path === '/api/products') {
          const count = Array.isArray(result.data) ? result.data.length : 
                       (result.data.products ? result.data.products.length : 0);
          console.log(`     Products found: ${count}`);
        }
        
        passed++;
      } else {
        console.log(`  ❌ FAILED - Expected status ${test.expectedStatus}, got ${result.status}`);
        console.log(`     Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ FAILED - Error: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  console.log('='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your Render deployment is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check your Render logs and environment variables.');
  }
}

runTests().catch(console.error);


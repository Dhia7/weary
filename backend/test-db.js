const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Environment variables:');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
  
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('\nAttempting to connect...');
    await client.connect();
    console.log('✅ Connection successful!');
    
    const result = await client.query('SELECT version()');
    console.log('Database version:', result.rows[0].version);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  }
}

testConnection();

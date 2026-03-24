const fetch = require('node-fetch');

async function testEndpoints() {
  console.log('🧪 Testing Available Endpoints...');
  
  try {
    // Test main page
    const main = await fetch('http://localhost:5000/');
    console.log('Main page status:', main.status);
    
    // Test register endpoint
    const register = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'test' })
    });
    console.log('Register endpoint status:', register.status);
    
    // Test upload endpoint
    const upload = await fetch('http://localhost:5000/api/upload');
    console.log('Upload endpoint status:', upload.status);
    
    // Test resident login (should be 404)
    const login = await fetch('http://localhost:5000/api/resident/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doorNumber: '1', email: 'test', password: 'test' })
    });
    console.log('Login endpoint status:', login.status);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEndpoints();

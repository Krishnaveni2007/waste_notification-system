const fetch = require('node-fetch');

async function debugLogin() {
  console.log('🔍 Debugging Resident Login...');
  
  try {
    // Test the login API
    const response = await fetch('http://localhost:5000/api/resident/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doorNumber: '1',
        email: 'ayyo1726@gmail.com',
        password: 'hey@#123'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const text = await response.text();
    console.log('Response body:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('✅ Parsed JSON:', json);
    } catch (e) {
      console.log('❌ Not JSON - HTML detected');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugLogin();

const fetch = require('node-fetch');

async function testResidentLogin() {
  console.log('🧪 Testing Resident Login...');
  
  try {
    // Test login with existing resident
    const response = await fetch('http://localhost:5000/api/resident/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doorNumber: '1',
        email: 'ayyo1726@gmail.com',
        password: 'hey@#123'
      })
    });
    
    const data = await response.json();
    console.log('✅ Login Response:', data);
    
    if (data.success) {
      console.log('🔗 Dashboard Link:', `http://localhost:5000/resident_dashboard.html?door=1&name=${encodeURIComponent(data.name)}`);
    } else {
      console.log('❌ Login Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testResidentLogin();

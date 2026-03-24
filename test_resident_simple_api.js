const fetch = require('node-fetch');

async function testResidentAPI() {
  console.log('🧪 Testing Resident API...');
  
  try {
    // Test the API endpoint used by simple dashboard
    const response = await fetch('http://localhost:5000/api/resident/by-door-name?door=1&name=swathi');
    console.log('Response status:', response.status);
    
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

testResidentAPI();

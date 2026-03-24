const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function testWorkerUpload() {
  console.log('🧪 Testing Worker Upload with Resident Email...');
  
  // Test data
  const form = new FormData();
  form.append('residentName', 'Veni');  // This resident has email
  form.append('doorNumber', '5');       // This door has email
  
  // Create a dummy image file
  const dummyImage = Buffer.from('fake-image-data');
  form.append('photo', dummyImage, {
    filename: 'test-violation.jpg',
    contentType: 'image/jpeg'
  });

  try {
    const response = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const result = await response.json();
    console.log('✅ Upload Result:', result);
    
    if (result.success) {
      console.log('📧 Email should be sent to: maheshwariharitha8@gmail.com');
      console.log('📬 Check your inbox for "1st Warning: Waste Segregation Violation"');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWorkerUpload();

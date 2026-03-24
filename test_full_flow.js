const fetch = require('node-fetch');
const FormData = require('form-data');

async function testFullFlow() {
  console.log('🧪 Testing Complete Flow...');
  
  try {
    // Step 1: Register new resident
    console.log('\n📝 Step 1: Registering new resident...');
    const registerResponse = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'Resident',
        name: 'TestUser',
        doorNumber: '999',
        email: 'test@example.com',
        password: 'test123'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('✅ Registration:', registerData);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Worker uploads violation
    console.log('\n📸 Step 2: Worker uploading violation...');
    const form = new FormData();
    form.append('residentName', 'TestUser');
    form.append('doorNumber', '999');
    
    // Create dummy image
    const dummyImage = Buffer.from('fake-image-data');
    form.append('photo', dummyImage, {
      filename: 'test-violation.jpg',
      contentType: 'image/jpeg'
    });
    
    const uploadResponse = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const uploadData = await uploadResponse.json();
    console.log('✅ Upload Result:', uploadData);
    
    if (uploadData.success) {
      console.log('\n📧 Email sent to: test@example.com');
      console.log('📋 Subject: Waste Warning ⚠');
      console.log('🔗 Check inbox for dashboard link!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFullFlow();

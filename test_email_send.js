const { sendWarningEmail } = require('./server/mailer');

async function testEmails() {
  console.log('Testing email functionality...\n');
  
  // Test resident email
  console.log('1. Testing resident email to maheshwariharitha8@gmail.com');
  await sendWarningEmail(
    'maheshwariharitha8@gmail.com',
    '🧪 Test Waste Warning ⚠',
    'This is a test email from the Waste Monitoring System.\n\nIf you receive this, real emails are working!\n\nWarning Level: Test\n\nDashboard: http://localhost:5000/resident.html?door=5&token=test123'
  );
  
  // Wait a bit between emails
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test head email
  console.log('\n2. Testing head email to maheshwari@gmail.com');
  await sendWarningEmail(
    'maheshwari@gmail.com',
    '🧪 Test Head Notification',
    'This is a test email for the Head.\n\nIf you receive this, head notifications are working!\n\nDashboard: http://localhost:5000/head.html?door=5&token=test456'
  );
  
  console.log('\n✅ Email test completed!');
}

testEmails().catch(console.error);

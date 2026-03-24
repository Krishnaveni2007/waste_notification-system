const { sendWarningEmail } = require('./server/mailer');
const db = require('./configuration/db');

async function testCompleteFlow() {
  console.log('🧪 COMPLETE VIOLATION FLOW TEST\n');
  
  try {
    const connection = await db.getConnection();
    
    // Test 1: First violation email to resident
    console.log('📧 1️⃣ Testing 1st Violation Email to Resident...');
    await sendWarningEmail(
      'maheshwariharitha8@gmail.com',
      '1st Warning: Waste Segregation Violation',
      `Dear Veni,\n\nThis is your 1st warning regarding a waste segregation violation.\n\nPlease segregate your waste according to guidelines.\n\nDashboard: http://localhost:5000/resident.html?door=5&token=test123`
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Second violation email to resident
    console.log('\n📧 2️⃣ Testing 2nd Violation Email to Resident...');
    await sendWarningEmail(
      'maheshwariharitha8@gmail.com',
      '2nd Warning: Waste Segregation Violation',
      `Dear Veni,\n\nThis is your 2nd warning regarding a waste segregation violation.\n\nPlease segregate your waste according to guidelines.\n\nDashboard: http://localhost:5000/resident.html?door=5&token=test123`
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Third violation email to HEAD (not resident)
    console.log('\n📧 3️⃣ Testing 3rd Violation Email to HEAD ONLY...');
    await sendWarningEmail(
      'maheshwari@gmail.com',
      '🚨 Resident reached 3rd violation',
      `Resident (Door No: 5) reached 3rd violation.\n\nClick below:\nhttp://localhost:5000/head.html?door=5&token=test456`
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Final warning to resident (after head clicks "Send Strict Warning")
    console.log('\n📧 4️⃣ Testing FINAL WARNING Email to Resident...');
    await sendWarningEmail(
      'maheshwariharitha8@gmail.com',
      '🚨 FINAL WARNING',
      `This is your final warning.\n\nNext violation = ₹500 fine\n\nClick:\nhttp://localhost:5000/resident.html?door=5&token=test123`
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 5: Fine imposition email to resident
    console.log('\n📧 5️⃣ Testing Fine Imposition Email to Resident...');
    await sendWarningEmail(
      'maheshwariharitha8@gmail.com',
      '💳 Fine Imposed ₹500',
      `A fine of ₹500 has been imposed.\n\nClick to pay:\nhttp://localhost:5000/resident.html?door=5&token=test123`
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 6: Payment confirmation to head
    console.log('\n📧 6️⃣ Testing Payment Confirmation Email to HEAD...');
    await sendWarningEmail(
      'maheshwari@gmail.com',
      '✅ Payment Completed',
      `Resident (Door 5) has paid the fine.`
    );
    
    console.log('\n✅ COMPLETE FLOW TEST FINISHED!');
    console.log('📧 Check both email inboxes for all test emails.');
    
    connection.release();
    await db.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCompleteFlow();

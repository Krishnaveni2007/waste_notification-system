const db = require('./configuration/db');

async function testRegistrationFlow() {
  console.log('🧪 Testing Registration Flow...');
  
  const connection = await db.getConnection();
  
  // 1. Check if resident exists
  const [existingResidents] = await connection.query(
    'SELECT * FROM residents WHERE name = ? AND door_number = ?',
    ['TestUser', '999']
  );
  
  if (existingResidents.length === 0) {
    console.log('❌ Resident not found. Creating new resident...');
    
    // 2. Register new resident
    const [result] = await connection.query(
      'INSERT INTO residents (name, door_number, email, password, warning_count, total_violations) VALUES (?, ?, ?, ?, 0, 0)',
      ['TestUser', '999', 'test@example.com', 'test123']
    );
    
    console.log('✅ Resident created with ID:', result.insertId);
    
    // 3. Generate token
    const token = require('crypto').randomBytes(32).toString('hex');
    await connection.query(
      "INSERT INTO access_tokens (resident_id, token, token_type) VALUES (?, ?, 'resident')",
      [result.insertId, token]
    );
    
    console.log('🔗 Dashboard link: http://localhost:5000/resident.html?door=999&token=' + token);
    console.log('📧 Would send email to: test@example.com');
    
  } else {
    console.log('✅ Resident already exists:', existingResidents[0]);
    console.log('📧 Email:', existingResidents[0].email);
  }
  
  connection.release();
  await db.end();
}

testRegistrationFlow();

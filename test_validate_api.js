const db = require('./configuration/db');

async function testValidateAPI() {
  const connection = await db.getConnection();
  
  // Test the exact same query as validateToken middleware
  const token = '7788d819015f3dbc2056ed6199dad1d9656b7bc479bbaec12304e744575317a3';
  const door = '1';
  
  const [tokens] = await connection.query(
    "SELECT at.*, r.door_number FROM access_tokens at JOIN residents r ON at.resident_id = r.id WHERE at.token = ? AND r.door_number = ? AND (at.expires_at IS NULL OR at.expires_at > datetime('now'))",
    [token, door]
  );
  
  console.log('Tokens found:', tokens.length);
  if (tokens.length > 0) {
    console.log('Token data:', JSON.stringify(tokens[0], null, 2));
    
    // Now test the resident query
    const [residents] = await connection.query('SELECT * FROM residents WHERE id = ?', [tokens[0].resident_id]);
    console.log('Residents found:', residents.length);
    if (residents.length > 0) {
      console.log('Resident data:', JSON.stringify(residents[0], null, 2));
    }
  }
  
  connection.release();
  await db.end();
}

testValidateAPI();

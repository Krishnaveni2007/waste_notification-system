const db = require('./configuration/db');

async function debugToken() {
  const connection = await db.getConnection();
  
  // Check if resident exists
  const [residents] = await connection.query('SELECT * FROM residents WHERE name = ? AND door_number = ?', ['swathi', '1']);
  console.log('Resident found:', residents.length);
  if (residents.length > 0) {
    console.log('Resident ID:', residents[0].id);
    console.log('Resident name:', residents[0].name);
    console.log('Resident door:', residents[0].door_number);
  }
  
  // Check if token exists
  const token = '7788d819015f3dbc2056ed6199dad1d9656b7bc479bbaec12304e744575317a3';
  const [tokens] = await connection.query(
    "SELECT at.*, r.door_number FROM access_tokens at JOIN residents r ON at.resident_id = r.id WHERE at.token = ? AND r.door_number = ? AND (at.expires_at IS NULL OR at.expires_at > datetime('now'))",
    [token, '1']
  );
  console.log('Token found:', tokens.length);
  if (tokens.length > 0) {
    console.log('Token resident_id:', tokens[0].resident_id);
    console.log('Token door_number:', tokens[0].door_number);
    console.log('Token type:', tokens[0].token_type);
  }
  
  connection.release();
  await db.end();
}

debugToken();

const db = require('./configuration/db');

async function generateFreshLink() {
  const connection = await db.getConnection();
  const [residents] = await connection.query('SELECT * FROM residents WHERE name = ? AND door_number = ?', ['swathi', '1']);
  if (residents.length > 0) {
    const token = require('crypto').randomBytes(32).toString('hex');
    await connection.query("INSERT INTO access_tokens (resident_id, token, token_type) VALUES (?, ?, 'resident')", [residents[0].id, token]);
    console.log('✅ Fresh link for swathi (Door 1):');
    console.log('http://localhost:5000/resident.html?door=1&token=' + token);
  } else {
    console.log('❌ Resident swathi (Door 1) not found');
  }
  connection.release();
  await db.end();
}

generateFreshLink();

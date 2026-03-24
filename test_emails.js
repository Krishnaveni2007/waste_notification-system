const db = require('./configuration/db');

async function checkResidents() {
  try {
    const connection = await db.getConnection();
    const [residents] = await connection.query('SELECT id, name, door_number, email FROM residents');
    console.log('Current Residents:');
    residents.forEach(r => {
      console.log(`ID: ${r.id}, Name: ${r.name}, Door: ${r.door_number}, Email: ${r.email || 'NOT SET'}`);
    });
    
    console.log('\nHead Email:');
    const [[headData]] = await connection.query('SELECT email FROM head LIMIT 1');
    console.log('Head Email:', headData ? headData.email : 'NOT SET');
    
    connection.release();
    await db.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkResidents();

const db = require('./configuration/db');

async function checkResidents() {
  console.log('👥 Checking all residents...');
  
  const connection = await db.getConnection();
  
  const [residents] = await connection.query('SELECT * FROM residents');
  console.log('Total residents:', residents.length);
  
  residents.forEach(resident => {
    console.log(`- Name: ${resident.name}, Door: ${resident.door_number}, Email: ${resident.email}, ID: ${resident.id}`);
  });
  
  connection.release();
  await db.end();
}

checkResidents();

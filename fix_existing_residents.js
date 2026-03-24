const db = require('./configuration/db');

async function generateTokensForExistingResidents() {
  try {
    const connection = await db.getConnection();
    
    // Get all residents with emails
    const [residents] = await connection.query(
      "SELECT id, name, door_number, email FROM residents WHERE email IS NOT NULL AND email != ''"
    );
    
    console.log('Found residents with emails:', residents.length);
    
    for (const resident of residents) {
      // Check if token already exists
      const [existingTokens] = await connection.query(
        "SELECT id FROM access_tokens WHERE resident_id = ? AND token_type = 'resident'",
        [resident.id]
      );
      
      if (existingTokens.length === 0) {
        // Generate secure token
        const token = require('crypto').randomBytes(32).toString('hex');
        
        // Insert token
        await connection.query(
          "INSERT INTO access_tokens (resident_id, token, token_type) VALUES (?, ?, 'resident')",
          [resident.id, token]
        );
        
        console.log(`✅ Generated token for ${resident.name} (Door: ${resident.door_number})`);
        console.log(`   Dashboard link: http://localhost:5000/resident.html?door=${resident.door_number}&token=${token}`);
      } else {
        console.log(`⚠️  ${resident.name} already has a token`);
      }
    }
    
    connection.release();
    await db.end();
    
    console.log('\n✅ Token generation completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

generateTokensForExistingResidents();

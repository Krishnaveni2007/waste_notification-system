const db = require('./configuration/db');

async function checkTokens() {
  const connection = await db.getConnection();
  const [tokens] = await connection.query('SELECT * FROM access_tokens');
  console.log('All tokens in database:');
  tokens.forEach(t => {
    console.log(`ID: ${t.id}, ResidentID: ${t.resident_id}, Token: ${t.token.substring(0, 20)}..., Type: ${t.token_type}`);
  });
  connection.release();
  await db.end();
}

checkTokens();

const db = require('./configuration/db');

async function checkDatabase() {
    try {
        const connection = await db.getConnection();
        const [residents] = await connection.query('SELECT * FROM residents');
        console.log('All residents in database:');
        console.log(JSON.stringify(residents, null, 2));
        connection.release();
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

checkDatabase();

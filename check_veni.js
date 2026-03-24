const db = require('./configuration/db');

async function checkVeni() {
    try {
        const connection = await db.getConnection();
        const [residents] = await connection.query(
            'SELECT name, door_number, fine_status, total_violations FROM residents WHERE name = ? AND door_number = ?',
            ['Veni', '5']
        );
        console.log('Veni database record:');
        console.log(JSON.stringify(residents[0], null, 2));
        connection.release();
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

checkVeni();

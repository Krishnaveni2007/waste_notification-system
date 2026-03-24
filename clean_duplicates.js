const db = require('./configuration/db');

async function cleanDuplicates() {
    try {
        const connection = await db.getConnection();
        
        // Delete duplicate entries with same door and name (case-insensitive)
        await connection.query(`
            DELETE FROM residents 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM residents 
                GROUP BY LOWER(door_number), LOWER(name)
            )
        `);
        
        console.log('Duplicates cleaned successfully');
        
        // Show remaining residents
        const [residents] = await connection.query('SELECT * FROM residents ORDER BY id');
        console.log('Remaining residents:');
        console.log(JSON.stringify(residents, null, 2));
        
        connection.release();
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

cleanDuplicates();

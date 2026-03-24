const mysql = require('mysql2/promise');

async function setupDatabase() {
  const passwords = ['', 'root', 'password', '123456'];
  let connected = false;
  let pool;

  // Try to connect with different passwords
  for (const pwd of passwords) {
    try {
      console.log(`Attempting to connect with password: '${pwd}'...`);
      
      pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: pwd,
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0
      });

      const connection = await pool.getConnection();
      console.log('✓ Connected successfully!');
      connected = true;

      // Create database and tables
      try {
        console.log('\n[1/3] Creating database...');
        await connection.query('CREATE DATABASE IF NOT EXISTS waste_monitoring');
        console.log('✓ Database created');

        console.log('[2/3] Switching to database...');
        await connection.query('USE waste_monitoring');

        console.log('[3/3] Creating tables...');
        
        // Create residents table
        await connection.query(`
          CREATE TABLE IF NOT EXISTS residents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            door_number VARCHAR(50) UNIQUE NOT NULL,
            warning_count INT DEFAULT 0,
            strict_warning TINYINT(1) DEFAULT 0,
            fine_status ENUM('NULL', 'Pending', 'Paid') DEFAULT 'NULL',
            fine_amount DECIMAL(10, 2) DEFAULT 0.00,
            head_message_active TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('  - Created residents table');

        // Create violations table
        await connection.query(`
          CREATE TABLE IF NOT EXISTS violations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            resident_id INT,
            photo_path VARCHAR(255),
            waste_type VARCHAR(50) DEFAULT 'Mixed Waste',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
          )
        `);
        console.log('  - Created violations table');

        // Create head table
        await connection.query(`
          CREATE TABLE IF NOT EXISTS head (
            id INT AUTO_INCREMENT PRIMARY KEY,
            qr_data TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        console.log('  - Created head table');

        // Seed data
        console.log('[4/4] Seeding sample data...');
        await connection.query(`
          INSERT IGNORE INTO residents (name, door_number) VALUES 
          ('John Doe', '101'),
          ('Jane Smith', '202'),
          ('Alice Brown', '303')
        `);
        await connection.query(`
          INSERT IGNORE INTO head (id, qr_data) VALUES 
          (1, 'upi://pay?pa=head@upi&pn=ApartmentHead&am=500&cu=INR')
        `);
        console.log('  - Seeded sample data');

        console.log('\n✅ Database setup complete!');
        console.log(`✅ Used password: '${pwd}'`);
        console.log('\n📝 Update your .env file with:');
        console.log(`DB_PASSWORD=${pwd}`);
        
        connection.release();
        await pool.end();
        return true;

      } catch (error) {
        console.error('Error setting up database:', error.message);
        connection.release();
        await pool.end();
        return false;
      }
    } catch (error) {
      console.log(`✗ Failed: ${error.message.split('\n')[0]}`);
      if (pool) await pool.end();
      continue;
    }
  }

  if (!connected) {
    console.error('\n❌ Could not connect to MySQL with any password');
    console.error('Please set MySQL root password and try again');
    process.exit(1);
  }
}

setupDatabase();

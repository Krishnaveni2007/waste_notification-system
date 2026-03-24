const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// Create SQLite database file in the project root
const dbPath = path.join(__dirname, '../waste_monitoring.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables if they don't exist
function initializeDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS residents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            door_number TEXT NOT NULL,
            warning_count INTEGER DEFAULT 0,
            total_violations INTEGER DEFAULT 0,
            strict_warning INTEGER DEFAULT 0,
            fine_status TEXT DEFAULT 'NULL',
            fine_amount REAL DEFAULT 0.00,
            head_message_active INTEGER DEFAULT 0,
            email TEXT DEFAULT '',
            password TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS violations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resident_id INTEGER,
            photo_path TEXT,
            waste_type TEXT DEFAULT 'Mixed Waste',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS head (
            id INTEGER PRIMARY KEY,
            qr_data TEXT,
            email TEXT DEFAULT '',
            password TEXT DEFAULT '',
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS workers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS access_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resident_id INTEGER,
            token TEXT UNIQUE NOT NULL,
            token_type TEXT DEFAULT 'resident',
            expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS fines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resident_id INTEGER,
            amount REAL DEFAULT 500.00,
            status TEXT DEFAULT 'pending',
            payment_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
        );
    `);

    // Add email and password columns to existing tables (fails gracefully if they already exist)
    try { db.exec("ALTER TABLE residents ADD COLUMN email TEXT DEFAULT ''"); } catch (e) {}
    try { db.exec("ALTER TABLE residents ADD COLUMN password TEXT DEFAULT ''"); } catch (e) {}
    try { db.exec("ALTER TABLE head ADD COLUMN email TEXT DEFAULT ''"); } catch (e) {}
    try { db.exec("ALTER TABLE head ADD COLUMN password TEXT DEFAULT ''"); } catch (e) {}

    // Insert sample data if not exists
    const checkResident = db.prepare('SELECT COUNT(*) as count FROM residents').get();
    if (checkResident.count === 0) {
        const insertResident = db.prepare('INSERT INTO residents (name, door_number) VALUES (?, ?)');
        insertResident.run('John Doe', '101');
        insertResident.run('Jane Smith', '202');
        insertResident.run('Alice Brown', '303');
    }

    const checkHead = db.prepare('SELECT COUNT(*) as count FROM head').get();
    if (checkHead.count === 0) {
        db.prepare('INSERT INTO head (id, qr_data) VALUES (?, ?)').run(
            1,
            'upi://pay?pa=head@upi&pn=ApartmentHead&am=500&cu=INR'
        );
    }

    console.log('✓ SQLite database initialized at:', dbPath);
}

// Initialize on load
initializeDatabase();

// Wrapper to maintain compatibility with mysql2/promise interface
class DatabaseWrapper {
    async getConnection() {
        return new ConnectionWrapper(db);
    }

    async end() {
        db.close();
    }
}

class ConnectionWrapper {
    constructor(database) {
        this.db = database;
    }

    async query(sql, params = []) {
        try {
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                const stmt = this.db.prepare(sql);
                return [stmt.all(...params)];
            } else {
                const stmt = this.db.prepare(sql);
                const result = stmt.run(...params);
                return [{ affectedRows: result.changes, insertId: result.lastInsertRowid }];
            }
        } catch (error) {
            throw error;
        }
    }

    release() {
        // No-op for SQLite
    }
}

module.exports = new DatabaseWrapper();
module.exports.db = db;

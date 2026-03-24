const db = require('better-sqlite3')('waste_monitoring.db');
const residents = db.prepare('SELECT id, name, door_number, email, warning_count FROM residents').all();
const head = db.prepare('SELECT id, email FROM head').all();
console.log('--- RESIDENTS ---');
console.table(residents);
console.log('\n--- HEAD ---');
console.table(head);

const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('../configuration/db');
const { sendWarningEmail } = require('./mailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Token generation utility
function generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Token validation middleware
async function validateToken(req, res, next) {
    const { door, token } = req.query;
    
    if (!door || !token) {
        return res.status(401).json({ error: 'Missing door number or token' });
    }
    
    try {
        const connection = await db.getConnection();
        const [tokens] = await connection.query(
            "SELECT at.*, r.door_number FROM access_tokens at JOIN residents r ON at.resident_id = r.id WHERE at.token = ? AND r.door_number = ? AND (at.expires_at IS NULL OR at.expires_at > datetime('now'))",
            [token, door]
        );
        connection.release();
        
        if (tokens.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        req.resident = tokens[0];
        next();
    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

// --- Auth Endpoints ---

// POST /api/register
app.post('/api/register', async (req, res) => {
    const { role, name, email, password, doorNumber } = req.body;
    
    if (!role || !name || !email || !password) {
        return res.status(400).json({ error: 'All primary fields are required' });
    }

    try {
        const connection = await db.getConnection();
        
        if (role === 'Resident') {
            if (!doorNumber) return res.status(400).json({ error: 'Door number is required for Resident' });
            const [residents] = await connection.query('SELECT * FROM residents WHERE door_number = ? AND LOWER(name) = LOWER(?)', [doorNumber, name]);
            if (residents.length > 0) {
                if (residents[0].email !== '' && residents[0].email !== null) {
                    connection.release();
                    return res.status(400).json({ error: 'Resident profile already registered. Please login.' });
                }
                await connection.query('UPDATE residents SET email = ?, password = ? WHERE id = ?', [email, password, residents[0].id]);
                
                // Generate token for resident access
                const residentToken = generateSecureToken();
                await connection.query(
                    "INSERT INTO access_tokens (resident_id, token, token_type) VALUES (?, ?, 'resident')",
                    [residents[0].id, residentToken]
                );
                
                res.json({ success: true, message: 'Resident account created successfully!' });
            } else {
                const [result] = await connection.query('INSERT INTO residents (name, door_number, email, password, warning_count, total_violations) VALUES (?, ?, ?, ?, 0, 0)', [name, doorNumber, email, password]);
                
                // Generate token for resident access
                const residentToken = generateSecureToken();
                await connection.query(
                    "INSERT INTO access_tokens (resident_id, token, token_type) VALUES (?, ?, 'resident')",
                    [result.insertId, residentToken]
                );
                
                res.json({ success: true, message: 'Resident account created successfully!' });
            }
        } else if (role === 'Worker') {
            const [check] = await connection.query('SELECT * FROM workers WHERE email = ?', [email]);
            if (check.length > 0) {
                connection.release();
                return res.status(400).json({ error: 'Worker with this email already exists' });
            }
            await connection.query('INSERT INTO workers (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
            res.json({ success: true, message: 'Worker registered successfully!' });
        } else if (role === 'Head') {
            const [headInfo] = await connection.query('SELECT * FROM head LIMIT 1');
            if (headInfo[0]) {
                if (headInfo[0].email !== '' && headInfo[0].email !== null && headInfo[0].email !== email) {
                    connection.release();
                    return res.status(400).json({ error: 'Head already registered.' });
                }
                await connection.query('UPDATE head SET email = ?, password = ? WHERE id = ?', [email, password, headInfo[0].id]);
            } else {
                await connection.query('INSERT INTO head (id, email, password) VALUES (1, ?, ?)', [email, password]);
            }
            
            // Send welcome email to head
            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
            const headLink = `${baseUrl}/head.html`;
            
            res.json({ success: true, message: 'Head account created successfully!' });
        } else {
            res.status(400).json({ error: 'Invalid role' });
        }
        connection.release();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and Password are required' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        
        // Check Residents
        const [residents] = await connection.query('SELECT * FROM residents WHERE email = ? AND password = ?', [email, password]);
        if (residents.length > 0) {
            connection.release();
            const user = residents[0];
            delete user.password;
            return res.json({ success: true, message: 'Login successful', user, role: 'Resident' });
        }
        
        // Check Workers
        const [workers] = await connection.query('SELECT * FROM workers WHERE email = ? AND password = ?', [email, password]);
        if (workers.length > 0) {
            connection.release();
            const user = workers[0];
            delete user.password;
            return res.json({ success: true, message: 'Login successful', user, role: 'Worker' });
        }
        
        // Check Head
        const [heads] = await connection.query('SELECT * FROM head WHERE email = ? AND password = ?', [email, password]);
        if (heads.length > 0) {
            connection.release();
            const user = heads[0];
            delete user.password;
            return res.json({ success: true, message: 'Login successful', user, role: 'Head' });
        }

        connection.release();
        res.status(401).json({ error: 'Invalid email or password' });
        
    } catch (err) {
        console.error(err);
        if (connection) connection.release();
        res.status(500).json({ error: 'Server error' });
    }
});

// --- API Endpoints ---
// 1. POST /upload - Worker uploads mixed waste report
app.post('/api/upload', upload.single('photo'), async (req, res) => {
    const { residentName, doorNumber } = req.body;
    const photoPath = req.file ? req.file.path : null;

    if (!residentName || !doorNumber || !photoPath) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const connection = await db.getConnection();
    try {
        // Find resident by both door number and name (case-insensitive)
        const [residents] = await connection.query(
            'SELECT * FROM residents WHERE door_number = ? AND LOWER(name) = LOWER(?)',
            [doorNumber, residentName]
        );

        let residentId;
        let newWarningCount;
        let newTotalViolations;
        
        if (residents.length === 0) {
            // Create resident if not exists
            const [result] = await connection.query(
                'INSERT INTO residents (name, door_number, warning_count, total_violations) VALUES (?, ?, 1, 1)',
                [residentName, doorNumber]
            );
            residentId = result.insertId;
            newWarningCount = 1;
            newTotalViolations = 1;
        } else {
            residentId = residents[0].id;
            newTotalViolations = residents[0].total_violations + 1;
            
            // If payment was completed (fine_status = 'Paid'), start new cycle from 1
            if (residents[0].fine_status === 'Paid') {
                newWarningCount = 1;
                // Reset payment status for new cycle
                await connection.query(
                    'UPDATE residents SET warning_count = ?, total_violations = ?, fine_status = NULL, strict_warning = 0, fine_amount = 0, head_message_active = 0 WHERE id = ?',
                    [newWarningCount, newTotalViolations, residentId]
                );
            } else {
                // Continue existing cycle
                newWarningCount = residents[0].warning_count + 1;
                await connection.query(
                    'UPDATE residents SET warning_count = ?, total_violations = ? WHERE id = ?',
                    [newWarningCount, newTotalViolations, residentId]
                );
            }
        }
        
        // Auto-impose fine for 4th violation in cycle OR 5th total violation
        if (newWarningCount >= 4 || newTotalViolations >= 5) {
            await connection.query(
                'UPDATE residents SET fine_status = ?, fine_amount = 500, head_message_active = 1 WHERE id = ?',
                ['Pending', residentId]
            );
        }

        // Record violation
        await connection.query(
            'INSERT INTO violations (resident_id, photo_path) VALUES (?, ?)',
            [residentId, photoPath]
        );

        // Fetch resident email
        const [[residentData]] = await connection.query('SELECT email FROM residents WHERE id = ?', [residentId]);
        const residentEmail = residentData ? residentData.email : '';

        // Email dispatching based on warnings with secure tokens
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        
        // Generate or get existing token for resident
        let residentToken;
        const [existingTokens] = await connection.query(
            "SELECT token FROM access_tokens WHERE resident_id = ? AND token_type = 'resident' AND (expires_at IS NULL OR expires_at > datetime('now'))",
            [residentId]
        );
        
        if (existingTokens.length === 0) {
            residentToken = generateSecureToken();
            await connection.query(
                "INSERT INTO access_tokens (resident_id, token, token_type) VALUES (?, ?, 'resident')",
                [residentId, residentToken]
            );
        } else {
            residentToken = existingTokens[0].token;
        }
        
        const residentLink = `${baseUrl}/resident.html?door=${doorNumber}&token=${residentToken}`;
        
        if (newWarningCount === 1) {
            // 1st violation - email resident
            sendWarningEmail(
                residentEmail, 
                'Waste Warning ⚠', 
                `Dear ${residentName},\n\nYou have received a waste warning.\n\nWarning Level: 1 / 2\n\nClick below to view your dashboard:\n${residentLink}`
            );
        } else if (newWarningCount === 2) {
            // 2nd violation - email resident
            sendWarningEmail(
                residentEmail, 
                'Waste Warning ⚠', 
                `Dear ${residentName},\n\nYou have received a waste warning.\n\nWarning Level: 2 / 2\n\nClick below to view your dashboard:\n${residentLink}`
            );
        } else if (newWarningCount === 3) {
            // 3rd violation - email head only (not resident)
            const [[headData]] = await connection.query('SELECT email FROM head LIMIT 1');
            const headEmail = (headData && headData.email) ? headData.email : process.env.HEAD_EMAIL;
            
            // Generate token for head access
            let headToken;
            const [existingHeadTokens] = await connection.query(
                "SELECT token FROM access_tokens WHERE resident_id = ? AND token_type = 'head' AND (expires_at IS NULL OR expires_at > datetime('now'))",
                [residentId]
            );
            
            if (existingHeadTokens.length === 0) {
                headToken = generateSecureToken();
                await connection.query(
                    "INSERT INTO access_tokens (resident_id, token, token_type) VALUES (?, ?, 'head')",
                    [residentId, headToken]
                );
            } else {
                headToken = existingHeadTokens[0].token;
            }
            
            const headLink = `${baseUrl}/head.html?door=${doorNumber}&token=${headToken}`;
            
            sendWarningEmail(
                headEmail, 
                '🚨 Resident reached 3rd violation', 
                `Resident (Door No: ${doorNumber}) reached 3rd violation.\n\nClick below:\n${headLink}`
            );
        }

        res.json({ success: true, message: 'Violation recorded successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        connection.release();
    }
});

// 2. GET /resident/:door/:name - Fetch resident status by door and name
app.get('/api/resident/:door/:name', async (req, res) => {
    try {
        const connection = await db.getConnection();
        const [residents] = await connection.query(
            'SELECT * FROM residents WHERE door_number = ? AND LOWER(name) = LOWER(?)',
            [req.params.door, req.params.name]
        );
        connection.release();

        if (residents.length === 0) {
            return res.status(404).json({ error: 'Resident not found' });
        }

        const resident = residents[0];

        // Generate QR Code if fine is imposed
        let qrCodeData = null;
        if (resident.fine_status === 'Pending') {
            const conn2 = await db.getConnection();
            const [headData] = await conn2.query('SELECT qr_data FROM head LIMIT 1');
            conn2.release();
            const qrText = headData[0] ? headData[0].qr_data : 'N/A';
            qrCodeData = await QRCode.toDataURL(qrText);
        }

        res.json({ ...resident, qrCodeData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2b. GET /resident/:door - Backward compatibility (returns first resident for door)
app.get('/api/resident/:door', async (req, res) => {
    try {
        const connection = await db.getConnection();
        const [residents] = await connection.query(
            'SELECT * FROM residents WHERE door_number = ?',
            [req.params.door]
        );
        connection.release();

        if (residents.length === 0) {
            return res.status(404).json({ error: 'Resident not found' });
        }

        const resident = residents[0];

        // Generate QR Code if fine is imposed
        let qrCodeData = null;
        if (resident.fine_status === 'Pending') {
            const conn2 = await db.getConnection();
            const [headData] = await conn2.query('SELECT qr_data FROM head LIMIT 1');
            conn2.release();
            const qrText = headData[0] ? headData[0].qr_data : 'N/A';
            qrCodeData = await QRCode.toDataURL(qrText);
        }

        res.json({ ...resident, qrCodeData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/resident/login - Simple login for residents
app.post('/api/resident/login', async (req, res) => {
    console.log('🔐 Resident login request received');
    const { doorNumber, email, password } = req.body;
    
    if (!doorNumber || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        const connection = await db.getConnection();
        const [residents] = await connection.query(
            'SELECT * FROM residents WHERE door_number = ? AND email = ? AND password = ?',
            [doorNumber, email, password]
        );
        connection.release();
        
        if (residents.length === 0) {
            return res.status(401).json({ error: 'Invalid door number, email, or password' });
        }
        
        const resident = residents[0];
        res.json({ 
            success: true, 
            message: 'Login successful',
            name: resident.name,
            door: resident.door_number,
            email: resident.email
        });
    } catch (error) {
        console.error('Resident login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/resident/by-door-name - Get resident by door and name (no token required)
app.get('/api/resident/by-door-name', async (req, res) => {
    const { door, name } = req.query;
    
    if (!door || !name) {
        return res.status(400).json({ error: 'Door number and name are required' });
    }
    
    try {
        const connection = await db.getConnection();
        const [residents] = await connection.query(
            'SELECT * FROM residents WHERE door_number = ? AND name = ?',
            [door, name]
        );
        connection.release();
        
        if (residents.length === 0) {
            return res.status(404).json({ error: 'Resident not found' });
        }
        
        res.json({ 
            success: true, 
            resident: residents[0] 
        });
    } catch (error) {
        console.error('Get resident error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/resident/validate - Validate token and return resident data
app.get('/api/resident/validate', validateToken, async (req, res) => {
    try {
        console.log('🔍 Validate request - resident_id:', req.resident.resident_id);
        const connection = await db.getConnection();
        const [residents] = await connection.query(
            'SELECT * FROM residents WHERE id = ?',
            [req.resident.resident_id]
        );
        console.log('👤 Residents found:', residents.length);
        connection.release();

        if (residents.length === 0) {
            return res.status(404).json({ error: 'Resident not found' });
        }

        const resident = residents[0];

        // Generate QR Code if fine is imposed
        let qrCodeData = null;
        if (resident.fine_status === 'Pending') {
            const conn2 = await db.getConnection();
            const [headData] = await conn2.query('SELECT qr_data FROM head LIMIT 1');
            conn2.release();
            const qrText = headData[0] ? headData[0].qr_data : 'N/A';
            qrCodeData = await QRCode.toDataURL(qrText);
        }

        res.json({ ...resident, qrCodeData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/head/validate - Validate head token and return resident data
app.get('/api/head/validate', async (req, res) => {
    const { door, token } = req.query;
    
    if (!door || !token) {
        return res.status(401).json({ error: 'Missing door number or token' });
    }
    
    try {
        const connection = await db.getConnection();
        const [tokens] = await connection.query(
            "SELECT at.*, r.door_number, r.name, r.warning_count, r.total_violations, r.strict_warning, r.fine_status FROM access_tokens at JOIN residents r ON at.resident_id = r.id WHERE at.token = ? AND r.door_number = ? AND at.token_type = 'head' AND (at.expires_at IS NULL OR at.expires_at > datetime('now'))",
            [token, door]
        );
        connection.release();
        
        if (tokens.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        
        res.json(tokens[0]);
    } catch (error) {
        console.error('Head token validation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/head/send-strict-warning - Send strict warning to resident
app.post('/api/head/send-strict-warning', async (req, res) => {
    const { doorNumber, residentId } = req.body;
    
    if (!doorNumber || !residentId) {
        return res.status(400).json({ error: 'Door number and resident ID are required' });
    }

    try {
        const connection = await db.getConnection();
        
        // Get resident details
        const [residents] = await connection.query(
            'SELECT * FROM residents WHERE id = ? AND door_number = ?',
            [residentId, doorNumber]
        );
        
        if (residents.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Resident not found' });
        }
        
        const resident = residents[0];
        
        // Update resident record
        await connection.query(
            'UPDATE residents SET strict_warning = 1, head_message_active = 1 WHERE id = ?',
            [residentId]
        );
        
        // Generate or get existing token for resident
        let residentToken;
        const [existingTokens] = await connection.query(
            'SELECT token FROM access_tokens WHERE resident_id = ? AND token_type = \'resident\' AND (expires_at IS NULL OR expires_at > datetime(\'now\'))',
            [residentId]
        );
        
        if (existingTokens.length === 0) {
            residentToken = generateSecureToken();
            await connection.query(
                'INSERT INTO access_tokens (resident_id, token, token_type) VALUES (?, ?, \'resident\')',
                [residentId, residentToken]
            );
        } else {
            residentToken = existingTokens[0].token;
        }
        
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const residentLink = `${baseUrl}/resident.html?door=${doorNumber}&token=${residentToken}`;
        
        // Send strict warning email to resident
        sendWarningEmail(
            resident.email, 
            '🚨 FINAL WARNING', 
            `This is your final warning.\n\nNext violation = ₹500 fine\n\nClick:\n${residentLink}`
        );
        
        connection.release();
        res.json({ success: true, message: 'Strict warning sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/head/impose-fine - Impose fine on resident
app.post('/api/head/impose-fine', async (req, res) => {
    const { doorNumber, residentId } = req.body;
    
    if (!doorNumber || !residentId) {
        return res.status(400).json({ error: 'Door number and resident ID are required' });
    }

    try {
        const connection = await db.getConnection();
        
        // Get resident details
        const [residents] = await connection.query(
            'SELECT * FROM residents WHERE id = ? AND door_number = ?',
            [residentId, doorNumber]
        );
        
        if (residents.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Resident not found' });
        }
        
        const resident = residents[0];
        
        // Update resident record
        await connection.query(
            'UPDATE residents SET fine_status = \'Pending\', fine_amount = 500 WHERE id = ?',
            [residentId]
        );
        
        // Create fine record
        await connection.query(
            'INSERT INTO fines (resident_id, amount, status) VALUES (?, 500, \'pending\')',
            [residentId]
        );
        
        // Generate or get existing token for resident
        let residentToken;
        const [existingTokens] = await connection.query(
            'SELECT token FROM access_tokens WHERE resident_id = ? AND token_type = \'resident\' AND (expires_at IS NULL OR expires_at > datetime(\'now\'))',
            [residentId]
        );
        
        if (existingTokens.length === 0) {
            residentToken = generateSecureToken();
            await connection.query(
                'INSERT INTO access_tokens (resident_id, token, token_type) VALUES (?, ?, \'resident\')',
                [residentId, residentToken]
            );
        } else {
            residentToken = existingTokens[0].token;
        }
        
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const residentLink = `${baseUrl}/resident.html?door=${doorNumber}&token=${residentToken}`;
        
        // Send fine imposition email to resident
        sendWarningEmail(
            resident.email, 
            '💳 Fine Imposed ₹500', 
            `A fine of ₹500 has been imposed.\n\nClick to pay:\n${residentLink}`
        );
        
        connection.release();
        res.json({ success: true, message: 'Fine imposed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/resident/pay-fine - Process fine payment
app.post('/api/resident/pay-fine', validateToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
        const residentId = req.resident.resident_id;
        
        // Update fine status
        await connection.query(
            'UPDATE fines SET status = \'paid\', payment_date = datetime(\'now\') WHERE resident_id = ? AND status = \'pending\'',
            [residentId]
        );
        
        // Update resident record
        await connection.query(
            'UPDATE residents SET fine_status = \'Paid\', fine_amount = 0 WHERE id = ?',
            [residentId]
        );
        
        // Get resident details for email
        const [residents] = await connection.query(
            'SELECT door_number FROM residents WHERE id = ?',
            [residentId]
        );
        
        // Get head email
        const [[headData]] = await connection.query('SELECT email FROM head LIMIT 1');
        const headEmail = (headData && headData.email) ? headData.email : process.env.HEAD_EMAIL;
        
        // Send payment confirmation to head
        sendWarningEmail(
            headEmail, 
            '✅ Payment Completed', 
            `Resident (Door ${residents[0].door_number}) has paid the fine.`
        );
        
        connection.release();
        res.json({ success: true, message: 'Payment processed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. GET /api/head - Fetch all violations for Head dashboard
app.get('/api/head', async (req, res) => {
    try {
        const connection = await db.getConnection();
        const [residents] = await connection.query(
            'SELECT r.*, (SELECT MAX(created_at) FROM violations v WHERE v.resident_id = r.id) as last_violation FROM residents r WHERE warning_count >= 3 OR total_violations >= 5'
        );

        const [headData] = await connection.query('SELECT qr_data FROM head LIMIT 1');
        connection.release();
        
        const qrText = headData[0] ? headData[0].qr_data : 'N/A';
        const qrCodeData = await QRCode.toDataURL(qrText);

        res.json({ residents, qrCodeData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 4. POST /strict-warning/:door
app.post('/api/strict-warning/:door', async (req, res) => {
    try {
        const connection = await db.getConnection();
        await connection.query(
            'UPDATE residents SET strict_warning = 1 WHERE door_number = ?',
            [req.params.door]
        );
        connection.release();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 5. POST /impose-fine/:door
app.post('/api/impose-fine/:door', async (req, res) => {
    try {
        const connection = await db.getConnection();
        await connection.query(
            'UPDATE residents SET fine_status = ?, fine_amount = 500, head_message_active = 1 WHERE door_number = ?',
            ['Pending', req.params.door]
        );
        connection.release();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 6. POST /pay/:door
app.post('/api/pay/:door', async (req, res) => {
    try {
        const connection = await db.getConnection();
        await connection.query(
            'UPDATE residents SET fine_status = ?, warning_count = 0, strict_warning = 0, fine_amount = 0, head_message_active = 0 WHERE door_number = ?',
            ['Paid', req.params.door]
        );
        connection.release();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 7. GET /worker-notifications - Tamil messages for non-payment
app.get('/api/worker-notifications', async (req, res) => {
    try {
        const connection = await db.getConnection();
        const [notifications] = await connection.query(
            'SELECT name, door_number FROM residents WHERE head_message_active = 1 AND fine_status = ?',
            ['Pending']
        );
        connection.release();
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

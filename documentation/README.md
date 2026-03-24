# Waste Monitoring System - Documentation

## Project Overview
This is a production-ready Waste Monitoring System designed for apartment complexes to ensure proper waste segregation. It features three specialized dashboards: Worker, Resident, and Head.

## Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JS, Bootstrap 5
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Key Modules:** Multer (Uploads), QRCODE (Payments), Helmet (Security), CORS.

## Escalation Logic
1. **1st Violation:** Resident sees "First Warning".
2. **2nd Violation:** Resident sees "Second Warning".
3. **3rd Violation:** Head is notified; Head clicks "Send Strict Warning"; Resident sees "Final Warning from Head".
4. **4th+ Violation:** Head clicks "Impose ₹500 Fine"; Resident sees "Fine Imposed ₹500" with a "Pay Now" button and Head's Payment QR.
5. **Payment:** Resident pays via QR; System resets warnings and status for that resident.
6. **Worker Alerts:** If a fine is pending, the Worker dashboard shows a Tamil alert: 
   *"⚠️ கவனம்: குடியிருப்பாளர் [Name] இன்னும் அபராதத்தை செலுத்தவில்லை."*

## Installation & Setup
1. **Database:** 
   - Execute the SQL script located in `configuration/db_setup.sql` in your MySQL environment.
2. **Backend Configuration:**
   - Navigate to the `server` folder.
   - Update the `.env` file with your MySQL credentials.
3. **Install Dependencies:**
   ```bash
   cd server
   npm install
   ```
4. **Run Server:**
   ```bash
   node server.js
   ```
5. **Frontend:**
   - Open `client/index.html` in your browser.

## Security Features
- **Helmet:** Implemented for secure HTTP headers.
- **Multer:** Configured with file size limits (5MB) and specific upload path.
- **Transaction Safety:** Backend handles concurrent requests and database integrity.

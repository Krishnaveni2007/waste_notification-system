const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

// Automatically configure a real mock sender if the user didn't write a .env file
async function initTransporter() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Use user's real credentials from .env if they exist
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        console.log('✓ Mailer configured with Real Google Account');
    } else {
        // If they didn't understand how to make a .env file, we create a fake testing account!
        console.log('No .env email found, automatically generating a test email account...');
        try {
            let testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false, 
                auth: {
                    user: testAccount.user, // fake generated email
                    pass: testAccount.pass  // fake generated password
                }
            });
            console.log('✓ Mock Mailer configured automatically for testing! Sender:', testAccount.user);
        } catch (err) {
            console.error('Failed to create mock test account:', err);
        }
    }
}

// Initialize on startup
initTransporter();

/**
 * Sends a warning email to a resident and/or head.
 * @param {string} to - The email address(es) to send to.
 * @param {string} subject - The subject of the email
 * @param {string} text - The content of the email
 */
async function sendWarningEmail(to, subject, text) {
    if (!to) {
        console.log('Skipping email. Registration data for this resident has NO valid email string.');
        return;
    }

    if (!transporter) {
        console.log('Transporter not fully ready yet, retrying...');
        await initTransporter();
    }

    const senderEmail = process.env.EMAIL_USER || '"WasteGuard Test Admin" <admin@wasteguard.test>';

    const mailOptions = {
        from: senderEmail,
        to: to,
        subject: subject,
        text: text
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log(`\n============================`);
        console.log(`📧 Email sent successfully!`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        
        // Ethereal gives a clickable preview URL for test emails!
        if (!process.env.EMAIL_USER) {
            console.log(`👀 PREVIEW YOUR EMAIL LIVE HERE: ${nodemailer.getTestMessageUrl(info)}`);
        }
        console.log(`============================\n`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = {
    sendWarningEmail
};

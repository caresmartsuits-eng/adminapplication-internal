// src/utils/nodemailer.js
const { logAudit } = require('../audits');
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");

dotenv.config();

// Load environment variables (assuming you have a .env file loaded by your server)
// These variables MUST be set in your .env file or environment:
// MAIL_HOST=smtp.gmail.com (or your service's SMTP host)
// MAIL_PORT=587 (or 465 for SSL)
// MAIL_USER=your_email@gmail.com
// MAIL_PASS=your_app_password_or_key
// FRONTEND_URL=http://localhost:5173 (or your deployed frontend URL)

// -----------------------------------------------------------
// ⚠️ IMPORTANT: If using Gmail, you MUST generate an "App Password"
// from your Google Account settings. You cannot use your regular login password.
// -----------------------------------------------------------

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.example.com',
    port: process.env.MAIL_PORT || 587,
    secure: process.env.MAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

/**
 * Sends a password reset email to the user.
 * @param {string} email - The user's email address.
 * @param {string} token - The JWT token for password reset.
 */
const sendPasswordResetEmail = async (email, token) => {
    // The link the user clicks to reset their password
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Email content
    const mailOptions = {
        from: `"Smart Suits admin application" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Password Reset Request</h2>
                <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px;">
                    Reset Password
                </a>
                <p style="margin-top: 20px;">This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        // Success Audit Log
        logAudit('Password reset email sent', email, { // Log the success
            email: email,
            messageId: info.messageId,
            status: 'SUCCESS',
        });
        console.log('Password reset email sent: %s', info.messageId);
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // For ethereal.email testing
        return true;
    } catch (error) {
        // Failure Audit Log
        logAudit('Password reset email failed', email, { // Log the failure
            email: email,
            error: error.message,
            status: 'FAILURE',
        });
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email.');
    }
};

module.exports = {
    sendPasswordResetEmail,
};
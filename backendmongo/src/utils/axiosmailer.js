const axios = require('axios');
const { logAudit } = require('../audits');
const dotenv = require("dotenv");

dotenv.config();

/**
 * Sends an email using the MailerSend API.
 * @param {string} email - The recipient's email
 * @param {string} subject - The email subject
 * @param {string} htmlContent - The HTML body content
 * @param {string} textContent - The plain text body content
 * @returns {Promise<boolean>}
 */
const sendEmail = async (email, subject, htmlContent, textContent) => {
    // --- Environment Variables ---
    const apiKey = process.env.MAIL_PASS; // The MailerSend API Token
    const senderEmail = process.env.MAIL_USER; // E.g., MS_4hqlOU@...
    const senderName = 'SmartSuits Support'; // Can be set in .env if preferred
    const mailersendUrl = 'https://api.mailersend.com/v1/email';

    // Guard clause for missing API key
    if (!apiKey) {
        console.error('MailerSend Error: MAIL_PASS (API Key) is not configured in .env');
        throw new Error('MailerSend API Key is missing.');
    }

    const recipientName = email.split('@')[0]; // Simple name extraction

    const mailersendPayload = {
        from: {
            email: senderEmail,
            name: senderName,
        },
        to: [{ email: email, name: recipientName }],
        subject: subject,
        text: textContent,
        html: htmlContent,
    };

    try {
        const response = await axios.post(
            mailersendUrl,
            mailersendPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                timeout: 10000 // 10 second timeout
            }
        );

        // MailerSend API returns 202 on successful queuing
        if (response.status === 202) {
            const messageId = response.data?.message?.id || 'unknown';

            logAudit('Email sent (API)', email, {
                subject: subject,
                messageId: messageId,
                status: 'SUCCESS',
            });

            console.log('Email sent via API: %s', messageId);
            return true;
        }

        // Catch non-202 status codes, which can sometimes be returned without throwing an error
        throw new Error(`MailerSend API returned status ${response.status}`);
    } catch (error) {
        let errorMessage;
        const apiResponse = error.response;

        if (apiResponse) {
            // Handle specific HTTP errors from MailerSend
            if (apiResponse.status === 401) {
                errorMessage = `Authentication Failed (401): Your MailerSend API Token (MAIL_PASS) is invalid or expired.`;
            } else if (apiResponse.status === 422) {
                errorMessage = `Validation Error (422): Check 'from' address verification or payload format. Details: ${JSON.stringify(apiResponse.data)}`;
            } else {
                errorMessage = `MailerSend API Error ${apiResponse.status}: ${JSON.stringify(apiResponse.data)}`;
            }
        } else {
            // Handle network/timeout errors (e.g., DNS error, ECONNREFUSED)
            errorMessage = `Network or Request Error: ${error.message}`;
        }

        logAudit('Email send failed (API)', email, {
            subject: subject,
            error: errorMessage,
            status: 'FAILURE',
        });

        console.error('Error sending email via API:', errorMessage);
        // Rethrow a simplified error for the calling function to handle
        throw new Error('Failed to send email. Check logs for details.');
    }
};

// --- Your original function for backward compatibility and clearer usage ---
const sendPasswordResetEmail = async (email, rstLink) => {

    const frontEndUrl = process.env.FRONTEND_URL || 'https://smartsuits.netlify.app';
    const resetLink = `${frontEndUrl}/reset-password?token=${rstLink}`;
    const recipientName = email.split('@')[0]; // Simple name extraction
    const subject = 'Password Reset Request';

    const htmlContent = `
        <p>Hello ${recipientName},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <div style="margin: 20px 0;">
            <a href="${resetLink}" target="_blank" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Your Password
            </a>
        </div>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Link: <a href="${resetLink}">${resetLink}</a></p>
        <p>The link will expire shortly.</p>
        <p>Thanks,<br>SmartSuits Team</p>
    `;

    const textContent = `
        Hello ${recipientName},
        You requested a password reset. Please click the following link to reset your password:
        ${resetLink}
        
        If you did not request this, please ignore this email.
        The link will expire shortly.
        
        Thanks,
        SmartSuits Team
    `;

    // Call the new general function
    return sendEmail(email, subject, htmlContent, textContent);
};

// Export the functions
module.exports = {
    sendPasswordResetEmail,
    sendEmail // Export the general function in case you need it later
};
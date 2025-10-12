// ... existing code ...
const express = require('express');
const bcrypt = require('bcrypt');
const { authenticateToken, checkAdmin } = require('../auth');
const { logAudit } = require('../audits');
const User = require('../models/User').default;
const { SECRET_KEY } = require('../auth');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../utils/nodemailer'); // Adjust path as needed

// ... existing code ...

const userRoutes = express.Router();
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

userRoutes.post('/admin/create-user', authenticateToken, checkAdmin, async (req, res) => {
    const { username, password, role, fullName, email, mobileNumber } = req.body;

    if (!username || !password || !role || !fullName || !email || !mobileNumber) {
        logAudit('Create user failed', req.user.username, { message: 'Missing fields', attempt: req.body });
        // Updated error message to reflect all mandatory fields
        return res.status(400).json({ error: 'Username, password, full name, email, and mobile number are required.' });
    }
  if (!['user', 'admin'].includes(role)) {
    logAudit('Create user failed', req.user.username, { message: 'Invalid role', attempt: req.body });
    return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin".' });
  }
    try {
        const existingUser = await User.findOne({
            $or: [{ username: username }, { email: email }]
        }).lean();
        if (existingUser) {
            // 4. Determine which field is a duplicate and send a specific 409 Conflict error
            let errorMessage = 'A user with that ';
            if (existingUser.username.toLowerCase() === username.toLowerCase()) {
                errorMessage += 'username already exists.';
            } else if (existingUser.email.toLowerCase() === email.toLowerCase()) {
                errorMessage += 'email address already exists.';
            } else {
                errorMessage = 'A user with that username or email already exists.';
            }

            logAudit('Create user failed', req.user.username, { message: errorMessage, attempt: req.body });
            return res.status(409).json({ error: errorMessage }); // Use 409 Conflict for duplicate resource
        }


    const hashed = await bcrypt.hash(password, 10);
        const doc = await User.create({
            username,
            password: hashed,
            role,
            fullName,
            email,
            mobileNumber
        });
    logAudit('User created', req.user.username, { newUser: username, role });
    res.status(201).json({ message: 'User created successfully', userId: doc._id.toString() });
  } catch (e) {
    if (e && e.code === 11000) {
      logAudit('Create user failed', req.user.username, { message: 'Username already exists', attempt: req.body });
      return res.status(409).json({ error: 'Username already exists' });
    }
    logAudit('Create user failed', req.user.username, { message: 'Database error', attempt: req.body });
    res.status(500).json({ error: 'Database error' });
  }
});



userRoutes.get('/admin/users', authenticateToken, checkAdmin, async (_req, res) => {
    try {
        // Selects new profile fields for admin user list dropdown
        const rows = await User.find({}).select('username role fullName email mobileNumber').lean();
        const data = rows.map(r => ({
            id: r._id.toString(),
            username: r.username,
            role: r.role,
            fullName: r.fullName,
            email: r.email,
            mobileNumber: r.mobileNumber
        }));
        res.json(data);

    } catch (_e) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ────────────────────────────────── NEW PROFILE ROUTES ──────────────────────────────────

// GET route to fetch a single user's profile details
userRoutes.get('/user/:username', authenticateToken, async (req, res) => {
    const requestedUsername = req.params.username;
    const loggedInUser = req.user.username;
    const role = req.user.role;

    // Authorization: Admin can view anyone, regular user can only view themselves.
    if (role !== 'admin' && requestedUsername !== loggedInUser) {
        logAudit('Profile details access denied', loggedInUser, { requestedUser: requestedUsername, reason: 'Unauthorized access attempt' });
        return res.status(403).json({ error: 'Access denied.' });
    }

    try {
        // Select all necessary profile fields
        const user = await User.findOne({ username: requestedUsername }).select('username role fullName email mobileNumber').lean();

        if (!user) {
            logAudit('Profile details fetch failed', loggedInUser, { requestedUser: requestedUsername, reason: 'User not found' });
            return res.status(404).json({ error: 'User not found.' });
        }

        logAudit('Profile details fetched', loggedInUser, { requestedUser: requestedUsername });
        // The model's toJSON transform handles removing password/id
        res.json(user);
    } catch (e) {
        logAudit('Profile details fetch failed', loggedInUser, { requestedUser: requestedUsername, reason: 'Database error', error: e.message });
        res.status(500).json({ error: 'Database error' });
    }
});

// PUT route to update a single user's profile details
userRoutes.put('/user/:username', authenticateToken, async (req, res) => {
    // Now, safely destructure from req.body
    const requestedUsername = req.params.username;
    const loggedInUser = req.user.username;
    const role = req.user.role;

    // Check if req.body is defined before destructuring
    if (!req.body) {
        logAudit('Profile update failed', req.user.username, { targetUser: requestedUsername, reason: 'Request body is empty' });
        return res.status(400).json({ error: 'Request data missing.' });
    }

    // FIX APPLIED HERE: Destructuring only happens if req.body exists
    const { fullName, email, mobileNumber } = req.body;

    // Authorization: Admin can update anyone, regular user can only update themselves.
    if (role !== 'admin' && requestedUsername !== loggedInUser) {
        logAudit('Profile update denied', loggedInUser, { targetUser: requestedUsername, reason: 'Unauthorized update attempt' });
        return res.status(403).json({ error: 'Access denied.' });
    }

    // Front-end validation specified that Email ID is mandatory
    if (!email || !fullName || !mobileNumber) {
        logAudit('Profile update failed', loggedInUser, { targetUser: requestedUsername, reason: 'Full name, email, and mobile number are required.' });
        return res.status(400).json({ error: 'Full name, email, and mobile number are required.' });
    }

    const updateFields = {
        fullName,
        email,
        mobileNumber,
    };

    try {
        const updatedUser = await User.findOneAndUpdate(
            { username: requestedUsername },
            { $set: updateFields },
            { new: true, runValidators: true } // Return the new document and run schema validators
        ).select('username role fullName email mobileNumber'); // Select updated fields for response

        if (!updatedUser) {
            logAudit('Profile update failed', loggedInUser, { targetUser: requestedUsername, reason: 'User not found' });
            return res.status(404).json({ error: 'User not found.' });
        }

        logAudit('Profile updated', loggedInUser, { targetUser: requestedUsername, changes: updateFields });
        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (e) {
        // Handle the unique constraint error for the email field
        if (e && e.code === 11000) {
            logAudit('Profile update failed', loggedInUser, { targetUser: requestedUsername, reason: 'Email already exists', attempt: req.body });
            return res.status(409).json({ error: 'Email already in use by another user.' });
        }
        logAudit('Profile update failed', loggedInUser, { targetUser: requestedUsername, reason: 'Database error', error: e.message });
        res.status(500).json({ error: 'Database error.' });
    }
});


// PUT route to update a user's password
userRoutes.put('/user/:username/password', authenticateToken, async (req, res) => {
    const requestedUsername = req.params.username;
    const loggedInUser = req.user.username;
    const { newPassword } = req.body;

    // Authorization: User can only change their own password
    if (requestedUsername !== loggedInUser) {
        logAudit('Password change denied', loggedInUser, { targetUser: requestedUsername, reason: 'Unauthorized password change attempt' });
        return res.status(403).json({ error: 'Access denied. You can only change your own password.' });
    }

    // 1. Check for missing password
    if (!newPassword) {
        logAudit('Password change failed', loggedInUser, { targetUser: requestedUsername, reason: 'New password missing' });
        return res.status(400).json({ error: 'New password is required.' });
    }

    // 2. Check password strength (Backend validation for extra security)
    if (!passwordRegex.test(newPassword)) {
        logAudit('Password change failed', loggedInUser, { targetUser: requestedUsername, reason: 'Password complexity failed' });
        return res.status(400).json({ error: 'Password must be at least 8 characters long, contain at least one letter and one number.' });
    }

    try {
        const user = await User.findOne({ username: requestedUsername });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // 3. Check if new password is the same as the old password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            logAudit('Password change failed', loggedInUser, { targetUser: requestedUsername, reason: 'New password is the same as old password' });
            return res.status(400).json({ error: 'New password cannot be the same as the current password.' });
        }

        // Hash and update the password
        const hashed = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ username: requestedUsername }, { $set: { password: hashed } });

        logAudit('Password changed', loggedInUser, { targetUser: requestedUsername });
        res.json({ message: 'Password updated successfully. Please log in again.' });

    } catch (e) {
        logAudit('Password change failed', loggedInUser, { targetUser: requestedUsername, reason: 'Database error', error: e.message });
        res.status(500).json({ error: 'Database error.' });
    }
});





// NEW ROUTE: Request Password Reset (Forgot Password)
userRoutes.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        logAudit('Forgot password failed', 'system', { message: 'Missing email field', attempt: req.body });
        return res.status(400).json({ error: 'Email ID is required' });
    }

    try {
        // 1. Find the user by their email address
        // NOTE: The User model MUST have an 'email' field for this to work.
        // I will assume you have updated User.js (as per UpdateProfile.jsx context)
        const user = await User.findOne({ email });

        // 2. Security measure: Always send a success message even if the email doesn't exist
        // to prevent user enumeration attacks. The internal logic still needs to check.
        if (!user) {
            // Log the attempt but return a generic success message
            logAudit('Forgot password requested', 'system', { email, result: 'Email not found but sent generic success' });
            return res.status(200).json({
                message: 'If an account exists for this email, a password reset link has been sent.',
            });
        }

        // 3. Create a unique, time-limited token (JWT)
        // The token payload contains the user ID and a unique secret.
        const resetToken = jwt.sign(
            { id: user._id.toString() },
            SECRET_KEY,
            { expiresIn: '1h' } // Token valid for 1 hour
        );

        // 4. Update the user record with the token and its expiration (for single use/validation)
        // Set a one-time-use flag/token value on the user document (optional but good practice)
        // For simplicity, we are relying on the JWT expiration for now.
        // If you want a "valid once" mechanism, you would store the token hash and clear it on use.

        // 5. Trigger the email send process
        await sendPasswordResetEmail(user.email, resetToken);
        console.log("send mail success");
        logAudit('Password reset requested', user.username, { email: user.email, token: 'created' });

        // 6. Return generic success message
        res.status(200).json({
            message: 'Password reset link has been sent.',
        });

    } catch (e) {
        logAudit('Forgot password error', 'system', { email, error: e.message });
        res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
    }
});



// --------------------------------------------------------------------------
// POST /api/reset-password
// Handles the final step of password reset: verifying the token and setting the new password.
// --------------------------------------------------------------------------
userRoutes.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    const logDetails = { token: token ? 'received' : 'missing', password: newPassword ? 'set' : 'missing' };

    if (!token || !newPassword) {
        logAudit('Password reset failed', 'system', { ...logDetails, reason: 'Missing token or password' });
        return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (!passwordRegex.test(newPassword)) {
        logAudit('Password reset failed', 'system', { ...logDetails, reason: 'Password complexity failed' });
        return res.status(400).json({ error: 'Password must be at least 8 characters long, contain at least one letter and one number.' });
    }

    try {
        // 1. Verify the JWT token
        const payload = jwt.verify(token, SECRET_KEY); // Will throw an error if token is expired or invalid
        const userId = payload.id;


        // 2. Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            logAudit('Password reset failed', 'system', { ...logDetails, reason: 'User not found for token ID' });
            return res.status(404).json({ error: 'Invalid or expired reset link.' });
        }

        // 3. Check if new password is the same as the old password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            logAudit('Password reset failed', user.username, { reason: 'New password is the same as old password' });
            return res.status(400).json({ error: 'New password cannot be the same as the current password.' });
        }

        // 4. Hash and update the password
        const hashed = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ _id: userId }, { $set: { password: hashed } });

        logAudit('Password reset successful', user.username, { email: user.email });
        res.json({ message: 'Password reset successfully. You can now log in with your new password.' });

    } catch (e) {
        // Handle JWT verification failure (Expired/Invalid Token)
        if (e.name === 'TokenExpiredError') {
            logAudit('Password reset failed', 'system', { ...logDetails, reason: 'Token expired' });
            return res.status(400).json({ error: 'Password reset link has expired.' });
        }
        if (e.name === 'JsonWebTokenError') {
            logAudit('Password reset failed', 'system', { ...logDetails, reason: 'Invalid token' });
            return res.status(400).json({ error: 'Invalid password reset link.' });
        }

        // General database or server error
        logAudit('Password reset failed', 'system', { ...logDetails, reason: 'Server error', error: e.message });
        res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
    }
});

userRoutes.get('/users/count', authenticateToken, async (_req, res) => {
    try {
        // Assuming your User model is imported
        const count = await User.countDocuments({});
        logAudit('Fetched order KPI user counts', _req.user.username, { count });
        res.json({ count });

    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = userRoutes;
// ... existing code ...

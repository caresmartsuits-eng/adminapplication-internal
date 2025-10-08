// ... existing code ...
const express = require('express');
const bcrypt = require('bcrypt');
const { authenticateToken, checkAdmin } = require('../auth');
const { logAudit } = require('../audits');
const User = require('../models/User').default;
// ... existing code ...

const userRoutes = express.Router();
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

userRoutes.post('/admin/create-user', authenticateToken, checkAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    logAudit('Create user failed', req.user.username, { message: 'Missing fields', attempt: req.body });
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }
  if (!['user', 'admin'].includes(role)) {
    logAudit('Create user failed', req.user.username, { message: 'Invalid role', attempt: req.body });
    return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin".' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const doc = await User.create({ username, password: hashed, role });
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
    if (!email) {
        logAudit('Profile update failed', loggedInUser, { targetUser: requestedUsername, reason: 'Email is required' });
        return res.status(400).json({ error: 'Email ID is mandatory.' });
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
module.exports = userRoutes;
// ... existing code ...

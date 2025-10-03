// ... existing code ...
const express = require('express');
const bcrypt = require('bcrypt');
const { authenticateToken, checkAdmin } = require('../auth');
const { logAudit } = require('../audits');
const User = require('../models/User').default;
// ... existing code ...

const userRoutes = express.Router();

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
    const rows = await User.find({}).select('username role').lean();
    const data = rows.map(r => ({ id: r._id.toString(), username: r.username, role: r.role }));
    res.json(data);
  } catch (_e) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = userRoutes;
// ... existing code ...

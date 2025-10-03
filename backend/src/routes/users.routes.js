const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { authenticateToken, checkAdmin } = require('../auth');
const { logAudit } = require('../audits');

const router = express.Router();

router.post('/admin/create-user', authenticateToken, checkAdmin, (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    logAudit('Create user failed', req.user.username, { message: 'Missing fields', attempt: req.body });
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }
  if (!['user', 'admin'].includes(role)) {
    logAudit('Create user failed', req.user.username, { message: 'Invalid role', attempt: req.body });
    return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin".' });
  }
  bcrypt.hash(password, 10, (err, hashed) => {
    if (err) {
      logAudit('Create user failed', req.user.username, { message: 'Password hashing error', attempt: req.body });
      return res.status(500).json({ error: 'Error hashing password' });
    }
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashed, role], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          logAudit('Create user failed', req.user.username, { message: 'Username already exists', attempt: req.body });
          return res.status(409).json({ error: 'Username already exists' });
        }
        logAudit('Create user failed', req.user.username, { message: 'Database error', attempt: req.body });
        return res.status(500).json({ error: 'Database error' });
      }
      logAudit('User created', req.user.username, { newUser: username, role });
      res.status(201).json({ message: 'User created successfully', userId: this.lastID });
    });
  });
});

router.get('/admin/users', authenticateToken, checkAdmin, (_req, res) => {
  db.all('SELECT id, username, role FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

module.exports = router;
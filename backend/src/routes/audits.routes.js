const express = require('express');
const db = require('../db');
const { authenticateToken, checkAdmin } = require('../auth');

const router = express.Router();

router.get('/audits', authenticateToken, checkAdmin, (_req, res) => {
  db.all('SELECT * FROM audits ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const audits = rows.map((r) => ({ ...r, details: r.details ? JSON.parse(r.details) : {} }));
    res.json(audits);
  });
});

module.exports = router;
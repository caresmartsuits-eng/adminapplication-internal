const express = require('express');
const db = require('../db');
const { authenticateToken, checkAdmin } = require('../auth');
const { logAudit } = require('../audits');

const router = express.Router();

router.get('/admin/configurations', authenticateToken, checkAdmin, (_req, res) => {
  db.all(
    'SELECT id, category, english_description, telugu_description, sort_order, created_date, status FROM configurations ORDER BY sort_order ASC, created_date DESC',
    [],
    (err, rows) => {
      if (err) {
        logAudit('List configurations failed', _req.user?.username || 'system', { message: 'Database error' });
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

router.get('/configurations/:category', authenticateToken, (req, res) => {
  const { category } = req.params;
  db.all(
    'SELECT english_description FROM configurations WHERE category = ? AND status = ? ORDER BY sort_order ASC',
    [category, 'A'],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

router.post('/admin/configurations/create', authenticateToken, checkAdmin, (req, res) => {
  const { category, english_description, telugu_description, sort_order, status } = req.body;
  if (!category || !english_description || !telugu_description || sort_order === undefined || !status) {
    logAudit('Create configuration failed', req.user.username, { message: 'Missing fields', attempt: req.body });
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['A', 'D'].includes(status)) {
    logAudit('Create configuration failed', req.user.username, { message: 'Invalid status', attempt: req.body });
    return res.status(400).json({ error: 'Invalid status. Must be "A" or "D".' });
  }
  const created_date = new Date().toISOString();
  db.run(
    'INSERT INTO configurations (category, english_description, telugu_description, sort_order, created_date, status) VALUES (?, ?, ?, ?, ?, ?)',
    [category, english_description, telugu_description, sort_order, created_date, status],
    function (err) {
      if (err) {
        logAudit('Create configuration failed', req.user.username, { message: 'Database error', attempt: req.body });
        return res.status(500).json({ error: 'Database error' });
      }
      logAudit('Configuration created', req.user.username, { configId: this.lastID, configDetails: req.body });
      res.status(201).json({ message: 'Configuration created successfully', configId: this.lastID });
    }
  );
});

router.put('/admin/configurations/update/:id', authenticateToken, checkAdmin, (req, res) => {
  const { id } = req.params;
  const { english_description, telugu_description, sort_order, status } = req.body;
  if (!english_description || !telugu_description || sort_order === undefined || !status) {
    logAudit('Update configuration failed', req.user.username, { message: 'Missing fields', attempt: req.body });
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['A', 'D'].includes(status)) {
    logAudit('Update configuration failed', req.user.username, { message: 'Invalid status', attempt: req.body });
    return res.status(400).json({ error: 'Invalid status. Must be "A" or "D".' });
  }
  db.run(
    'UPDATE configurations SET english_description = ?, telugu_description = ?, sort_order = ?, status = ? WHERE id = ?',
    [english_description, telugu_description, sort_order, status, id],
    function (err) {
      if (err) {
        logAudit('Update configuration failed', req.user.username, { message: 'Database error', configId: id, attempt: req.body });
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        logAudit('Update configuration failed', req.user.username, { message: 'Configuration not found', configId: id, attempt: req.body });
        return res.status(404).json({ error: 'Configuration not found' });
      }
      logAudit('Configuration updated', req.user.username, { configId: id, updatedDetails: req.body });
      res.status(200).json({ message: 'Configuration updated successfully' });
    }
  );
});

module.exports = router;
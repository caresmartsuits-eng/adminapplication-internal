const express = require('express');
const db = require('../db');
const { authenticateToken, checkAdmin } = require('../auth');
const { logAudit } = require('../audits');

const router = express.Router();

router.get('/admin/config-headers', authenticateToken, checkAdmin, (_req, res) => {
  db.all(
    'SELECT id, category_code, category_description_english, category_description_telugu, created_by, created_date, status FROM config_headers ORDER BY category_description_english ASC',
    [],
    (err, rows) => {
      if (err) {
        logAudit('List config headers failed', _req.user?.username || 'system', { message: 'Database error' });
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

router.get('/admin/active-config-headers', authenticateToken, checkAdmin, (_req, res) => {
  db.all(
    'SELECT category_code, category_description_english FROM config_headers WHERE status = ? ORDER BY category_description_english ASC',
    ['A'],
    (err, rows) => {
      if (err) {
        logAudit('List active config headers failed', _req.user?.username || 'system', { message: 'Database error' });
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

router.post('/admin/config-headers/create', authenticateToken, checkAdmin, (req, res) => {
  const { category_code, category_description_english, category_description_telugu, status } = req.body;
  if (!category_code || !category_description_english || !category_description_telugu || !status) {
    logAudit('Create config header failed', req.user.username, { message: 'Missing fields', attempt: req.body });
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['A', 'D'].includes(status)) {
    logAudit('Create config header failed', req.user.username, { message: 'Invalid status', attempt: req.body });
    return res.status(400).json({ error: 'Invalid status. Must be "A" or "D".' });
  }
  const created_by = req.user.username;
  const created_date = new Date().toISOString();
  db.run(
    'INSERT INTO config_headers (category_code, category_description_english, category_description_telugu, created_by, created_date, status) VALUES (?, ?, ?, ?, ?, ?)',
    [category_code, category_description_english, category_description_telugu, created_by, created_date, status],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          logAudit('Create config header failed', req.user.username, { message: 'Category code already exists', attempt: req.body });
          return res.status(409).json({ error: 'Category code already exists' });
        }
        logAudit('Create config header failed', req.user.username, { message: 'Database error', attempt: req.body });
        return res.status(500).json({ error: 'Database error' });
      }
      logAudit('Config header created', req.user.username, { configHeaderId: this.lastID, configHeaderDetails: req.body });
      res.status(201).json({ message: 'Config header created successfully', id: this.lastID });
    }
  );
});

router.put('/admin/config-headers/update/:id', authenticateToken, checkAdmin, (req, res) => {
  const { id } = req.params;
  const { category_description_english, category_description_telugu, status } = req.body;
  if (!category_description_english || !category_description_telugu || !status) {
    logAudit('Update config header failed', req.user.username, { message: 'Missing fields', attempt: req.body });
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['A', 'D'].includes(status)) {
    logAudit('Update config header failed', req.user.username, { message: 'Invalid status', attempt: req.body });
    return res.status(400).json({ error: 'Invalid status. Must be "A" or "D".' });
  }
  const updatedBy = req.user.username;
  db.run(
    'UPDATE config_headers SET category_description_english = ?, category_description_telugu = ?, created_by = ?, status = ? WHERE id = ?',
    [category_description_english, category_description_telugu, updatedBy, status, id],
    function (err) {
      if (err) {
        logAudit('Update config header failed', req.user.username, { message: 'Database error', configId: id, attempt: req.body });
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        logAudit('Update config header failed', req.user.username, { message: 'Config header not found', configId: id, attempt: req.body });
        return res.status(404).json({ error: 'Config header not found' });
      }
      logAudit('Config header updated', req.user.username, { configId: id, updatedDetails: req.body });
      res.status(200).json({ message: 'Config header updated successfully' });
    }
  );
});

module.exports = router;
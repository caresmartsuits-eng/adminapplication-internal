// ... existing code ...
const express = require('express');
const { authenticateToken, checkAdmin } = require('../auth');
const { logAudit } = require('../audits');
const ConfigHeader = require('../models/ConfigHeader').default;
// ... existing code ...

const configHeadersRoutes = express.Router();

configHeadersRoutes.get('/admin/config-headers', authenticateToken, checkAdmin, async (_req, res) => {
  try {
    const rows = await ConfigHeader.find({})
      .sort({ category_description_english: 1 })
      .lean();
    const data = rows.map(r => ({
      id: r._id.toString(),
      category_code: r.category_code,
      category_description_english: r.category_description_english,
      category_description_telugu: r.category_description_telugu,
      created_by: r.created_by ?? null,
      created_date: r.created_date,
      status: r.status,
    }));
    res.json(data);
  } catch (e) {
    logAudit('List config headers failed', _req.user?.username || 'system', { message: 'Database error' });
    res.status(500).json({ error: 'Database error' });
  }
});

configHeadersRoutes.get('/admin/active-config-headers', authenticateToken, checkAdmin, async (_req, res) => {
  try {
    const rows = await ConfigHeader.find({ status: 'A' })
      .sort({ category_description_english: 1 })
      .select('category_code category_description_english')
      .lean();
    res.json(rows);
  } catch (_e) {
    logAudit('List active config headers failed', _req.user?.username || 'system', { message: 'Database error' });
    res.status(500).json({ error: 'Database error' });
  }
});

configHeadersRoutes.post('/admin/config-headers/create', authenticateToken, checkAdmin, async (req, res) => {
  const { category_code, category_description_english, category_description_telugu, status } = req.body;
  if (!category_code || !category_description_english || !category_description_telugu || !status) {
    logAudit('Create config header failed', req.user.username, { message: 'Missing fields', attempt: req.body });
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['A', 'D'].includes(status)) {
    logAudit('Create config header failed', req.user.username, { message: 'Invalid status', attempt: req.body });
    return res.status(400).json({ error: 'Invalid status. Must be "A" or "D".' });
  }
  try {
    const created_by = req.user.username;
    const created_date = new Date().toISOString();
    const doc = await ConfigHeader.create({
      category_code,
      category_description_english,
      category_description_telugu,
      created_by,
      created_date,
      status,
    });
    logAudit('Config header created', req.user.username, { configHeaderId: doc._id.toString(), configHeaderDetails: req.body });
    res.status(201).json({ message: 'Config header created successfully', id: doc._id.toString() });
  } catch (e) {
    if (e && e.code === 11000) {
      logAudit('Create config header failed', req.user.username, { message: 'Category code already exists', attempt: req.body });
      return res.status(409).json({ error: 'Category code already exists' });
    }
    logAudit('Create config header failed', req.user.username, { message: 'Database error', attempt: req.body });
    res.status(500).json({ error: 'Database error' });
  }
});

configHeadersRoutes.put('/admin/config-headers/update/:id', authenticateToken, checkAdmin, async (req, res) => {
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
  try {
    const updated = await ConfigHeader.findByIdAndUpdate(
      id,
      {
        category_description_english,
        category_description_telugu,
        created_by: req.user.username,
        status,
      },
      { new: true }
    );
    if (!updated) {
      logAudit('Update config header failed', req.user.username, { message: 'Config header not found', configId: id, attempt: req.body });
      return res.status(404).json({ error: 'Config header not found' });
    }
    logAudit('Config header updated', req.user.username, { configId: id, updatedDetails: req.body });
    res.status(200).json({ message: 'Config header updated successfully' });
  } catch (_e) {
    logAudit('Update config header failed', req.user.username, { message: 'Database error', configId: id, attempt: req.body });
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = configHeadersRoutes;
// ... existing code ...

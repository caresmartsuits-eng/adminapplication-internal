// ... existing code ...
const express = require('express');
const { authenticateToken, checkAdmin } = require('../auth');
const { logAudit } = require('../audits');
const Configuration = require('../models/Configuration').default;
// ... existing code ...

const configsRoutes = express.Router();

configsRoutes.get('/admin/configurations', authenticateToken, checkAdmin, async (_req, res) => {
  try {
    const rows = await Configuration.find({})
      .sort({ sort_order: 1, created_date: -1 })
      .lean();
    const data = rows.map(r => ({
      id: r._id.toString(),
      category: r.category,
      english_description: r.english_description,
      telugu_description: r.telugu_description,
      sort_order: r.sort_order,
      created_date: r.created_date,
      status: r.status,
    }));
    res.json(data);
  } catch (_e) {
    logAudit('List configurations failed', _req.user?.username || 'system', { message: 'Database error' });
    res.status(500).json({ error: 'Database error' });
  }
});
configsRoutes.get('/configurations/active', authenticateToken, async (req, res) => {
    try {
        const { category, includeDisabled } = req.query;

        const filter = {};
        if (category) filter.category = category;
        filter.status = includeDisabled === 'true' ? { $in: ['A', 'D'] } : 'A';

        const rows = await Configuration.find(filter)
            .sort({ sort_order: 1, created_date: -1 })
            .lean();

        const data = rows.map(r => ({
            id: r._id.toString(),
            category: r.category,
            english_description: r.english_description,
            telugu_description: r.telugu_description,
            sort_order: r.sort_order,
            created_date: r.created_date,
            status: r.status, // product status
        }));

        logAudit('List active configurations', req.user?.username || 'system', { count: data.length, category: category || null });
        res.json(data);
    } catch (_e) {
        logAudit('List active configurations failed', req.user?.username || 'system', { message: 'Database error' });
        res.status(500).json({ error: 'Database error' });
    }
});

configsRoutes.get('/configurations/:category', authenticateToken, async (req, res) => {
  const { category } = req.params;
  try {
    const rows = await Configuration.find({ category, status: 'A' })
      .sort({ sort_order: 1 })
      .select('english_description')
      .lean();
    res.json(rows);
  } catch (_e) {
    res.status(500).json({ error: 'Database error' });
  }
});

configsRoutes.post('/admin/configurations/create', authenticateToken, checkAdmin, async (req, res) => {
  const { category, english_description, telugu_description, sort_order, status } = req.body;
  if (!category || !english_description || !telugu_description || sort_order === undefined || !status) {
    logAudit('Create configuration failed', req.user.username, { message: 'Missing fields', attempt: req.body });
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['A', 'D'].includes(status)) {
    logAudit('Create configuration failed', req.user.username, { message: 'Invalid status', attempt: req.body });
    return res.status(400).json({ error: 'Invalid status. Must be "A" or "D".' });
  }
  try {
    const created_date = new Date().toISOString();
    const doc = await Configuration.create({
      category,
      english_description,
      telugu_description,
      sort_order,
      created_date,
      status,
    });
    logAudit('Configuration created', req.user.username, { configId: doc._id.toString(), configDetails: req.body });
    res.status(201).json({ message: 'Configuration created successfully', configId: doc._id.toString() });
  } catch (_e) {
    logAudit('Create configuration failed', req.user.username, { message: 'Database error', attempt: req.body });
    res.status(500).json({ error: 'Database error' });
  }
});

configsRoutes.put('/admin/configurations/update/:id', authenticateToken, checkAdmin, async (req, res) => {
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
  try {
    const updated = await Configuration.findByIdAndUpdate(
      id,
      { english_description, telugu_description, sort_order, status },
      { new: true }
    );
    if (!updated) {
      logAudit('Update configuration failed', req.user.username, { message: 'Configuration not found', configId: id, attempt: req.body });
      return res.status(404).json({ error: 'Configuration not found' });
    }
    logAudit('Configuration updated', req.user.username, { configId: id, updatedDetails: req.body });
    res.status(200).json({ message: 'Configuration updated successfully' });
  } catch (_e) {
    logAudit('Update configuration failed', req.user.username, { message: 'Database error', configId: id, attempt: req.body });
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = configsRoutes;
// ... existing code ...

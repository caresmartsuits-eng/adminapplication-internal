// ... existing code ...
const express = require('express');
const { authenticateToken, checkAdmin } = require('../auth');
const Audit = require('../models/Audit').default;
// ... existing code ...

const auditRoutes = express.Router();

auditRoutes.get('/audits', authenticateToken, checkAdmin, async (_req, res) => {
  try {
    const rows = await Audit.find({}).sort({ timestamp: -1 }).lean();
    // Ensure same shape (details already object, timestamp is string)
    const audits = rows.map((r) => ({ ...r, id: r._id.toString(), _id: undefined }));
    res.json(audits);
  } catch (_e) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = auditRoutes;
// ... existing code ...

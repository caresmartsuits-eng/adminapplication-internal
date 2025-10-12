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

// --- NEW ROUTE: GET RECENT AUDIT LOGS FOR DASHBOARD ---
// Allows fetching a limited, most recent set of logs
// We'll keep the checkAdmin middleware for consistency with the full audit log access.
auditRoutes.get('/audits/recent', authenticateToken, checkAdmin, async (req, res) => {
    try {
        // Get the limit from the query string (e.g., ?limit=5), defaulting to 5
        const limit = parseInt(req.query.limit, 10) || 5;
        const filter = {username : {$ne: 'admin'}};

        const recentLogs = await Audit.find(filter)
            .sort({ timestamp: -1 }) // Sort by timestamp descending (newest first)
            .limit(limit)            // Apply the limit
            .lean();                 // Return plain JavaScript objects

        // Map the logs to ensure the ID is correctly formatted
        const audits = recentLogs.map((r) => ({
            ...r,
            id: r._id.toString(),
            _id: undefined
        }));

        res.json(audits);
    } catch (e) {
        console.error("Error fetching recent audit logs:", e);
        res.status(500).json({ error: 'Database error' });
    }
});


module.exports = auditRoutes;
// ... existing code ...

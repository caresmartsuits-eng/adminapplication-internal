const db = require('./db');

function logAudit(action, username, details) {
  db.run(
    'INSERT INTO audits (action, username, details) VALUES (?, ?, ?)',
    [action, username, JSON.stringify(details)],
    (err) => {
      if (err) console.error('Error logging audit event:', err.message);
    }
  );
}

module.exports = { logAudit };
// ... existing code ...
const Audit = require('./models/Audit').default;
// ... existing code ...

function logAudit(action, username, details) {
  // Fire-and-forget; no need to block request
  Audit.create({ action, username, details }).catch((err) =>
    console.error('Error logging audit event:', err.message)
  );
}

module.exports = { logAudit };
// ... existing code ...

// ... existing code ...
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'your_super_secret_key';
// ... existing code ...

/*function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}*/

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    // FIX: Explicitly send JSON error for missing token (401 Unauthorized)
    if (!token) return res.status(401).json({ error: 'Client not authorized: Missing token' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        // FIX: Explicitly send JSON error for invalid token (403 Forbidden)
        if (err) return res.status(403).json({ error: 'Client not authorized: Invalid token' });

        req.user = user;
        next();
    });
}

function checkAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  next();
}

module.exports = { authenticateToken, checkAdmin, SECRET_KEY };
// ... existing code ...

// backend/src/routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { logAudit } = require('../audits');
const { SECRET_KEY } = require('../auth');

// Import ESM default export from CommonJS
const User = require('../models/User').default;

const authRouter = express.Router();

authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username }).lean();
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    // Compare password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid username or password' });

    // Sign JWT (use Mongo _id as id)
    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    logAudit('User login', user.username, { message: 'Successfully logged in' });
    res.json({ token, role: user.role });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = authRouter;

const express = require('express');
const path = require('path');
const cors = require('cors');

require('./db'); // initialize DB
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const orderRoutes = require('./routes/orders.routes');
const auditRoutes = require('./routes/audits.routes');
const configsRoutes = require('./routes/configs.routes');
const configHeadersRoutes = require('./routes/configHeaders.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS (adjust origin as needed)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', orderRoutes);
app.use('/api', auditRoutes);
app.use('/api', configsRoutes);
app.use('/api', configHeadersRoutes);

// Static (optional for production serving of client)
const clientBuild = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(clientBuild));


// Express 5 compatible SPA fallback (must be AFTER /api routes and static)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientBuild, 'index.html'), (err) => {
    if (err) res.status(200).send('Client not built. Run frontend build.');
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// ... existing code ...

const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

// DB and models (ESM models exported as default -> access via .default)
const { connectMongo } = require('./db/mongo.js');
const User = (require('./models/User.js').default) || require('./models/User.js');
const Order = (require('./models/Order.js').default) || require('./models/Order.js');
const Configuration = (require('./models/Configuration.js').default) || require('./models/Configuration.js');
const ConfigHeader = (require('./models/ConfigHeader.js').default) || require('./models/ConfigHeader.js');
const Audit = (require('./models/Audit.js').default) || require('./models/Audit.js');

// Routes (CommonJS)
const authRoutes = require('./routes/auth.routes.js');
const userRoutes = require('./routes/users.routes.js');
const orderRoutes = require('./routes/orders.routes.js');
const auditRoutes = require('./routes/audits.routes.js');
const configsRoutes = require('./routes/configs.routes.js');
const configHeadersRoutes = require('./routes/configHeaders.routes.js');

// Env
dotenv.config();

// __dirname in CommonJS is available directly
const app = express();


const corsOptions = {
    // Replace 'http://localhost:5173' with your actual frontend URL in production
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies and authentication headers
    optionsSuccessStatus: 204 // Handle preflight requests gracefully
};

async function start() {
    try {
        await connectMongo();
        await initOnce();

        app.use(cors(corsOptions));
        app.use(express.json());

        // API routes
        app.use('/api', authRoutes);
        app.use('/api', userRoutes);
        app.use('/api', orderRoutes);
        app.use('/api', auditRoutes);
        app.use('/api', configsRoutes);
        app.use('/api', configHeadersRoutes);

        // Static (optional)
        const clientBuild = path.join(__dirname, '..', 'client', 'build');
        app.use(express.static(clientBuild));

        app.use((req, res, next) => {
            if (req.path.startsWith('/api')) return next();
            res.sendFile(path.join(clientBuild, 'index.html'), (err) => {
                if (err) res.status(200).send('Client not built. Run frontend build.');
            });
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

async function initOnce() {
    await Promise.all([
        User.init(),
        Order.init(),
        Configuration.init(),
        ConfigHeader.init(),
    ]);

    const admin = await User.findOne({ username: 'admin' }).lean();
    if (!admin) {
        const password = await bcrypt.hash('adminpassword', 10);
        await User.create({ username: 'admin', password, role: 'admin' });
        console.log('Seeded admin user');
    } else {
        console.log('Admin user already exists');
    }

    const count = await ConfigHeader.estimatedDocumentCount();
    if (count === 0) {
        const now = new Date().toISOString();
        await ConfigHeader.insertMany([
            { category_code: 'PROD_TYPE', category_description_english: 'Product Type', category_description_telugu: 'ఉత్పత్తి రకం', created_by: null, created_date: now, status: 'A' },
            { category_code: 'ORDER_STATUS', category_description_english: 'Order Status', category_description_telugu: 'ఆర్డర్ స్థితి', created_by: null, created_date: now, status: 'A' },
            { category_code: 'USER_ROLE', category_description_english: 'User Role', category_description_telugu: 'వినియోగదారు పాత్ర', created_by: null, created_date: now, status: 'A' },
        ]);
        console.log('Seeded initial config headers');
    }
}

start().catch((err) => {
    console.error('Startup error:', err);
    process.exit(1);
});
// ... existing code ...
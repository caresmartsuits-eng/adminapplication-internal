const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('app.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the persistent SQLite database.');
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user' NOT NULL
      )`, (err) => {
        if (err) return console.error('Error creating users table:', err.message);
        db.get('SELECT username FROM users WHERE username = ?', ['admin'], (err, row) => {
          if (err) return console.error('Error checking for admin user:', err.message);
          if (!row) {
            const hashedPassword = bcrypt.hashSync('adminpassword', 10);
            const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
            stmt.run('admin', hashedPassword, 'admin', (err) => {
              if (err) console.error('Error inserting admin user:', err.message);
              else console.log('Initial admin user created successfully.');
              stmt.finalize();
            });
          } else {
            console.log('Admin user already exists.');
          }
        });
      });

      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY,
        snum TEXT NOT NULL,
        order_number INTEGER NOT NULL,
        product_type TEXT NOT NULL,
        delivery_date TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_user TEXT NOT NULL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS audits (
        id INTEGER PRIMARY KEY,
        action TEXT NOT NULL,
        username TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        details TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS configurations (
        id INTEGER PRIMARY KEY,
        category TEXT NOT NULL,
        english_description TEXT NOT NULL,
        telugu_description TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        created_date TEXT NOT NULL,
        status TEXT DEFAULT 'A' NOT NULL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS config_headers (
        id INTEGER PRIMARY KEY,
        category_code TEXT UNIQUE NOT NULL,
        category_description_english TEXT NOT NULL,
        category_description_telugu TEXT NOT NULL,
        created_by TEXT,
        created_date TEXT NOT NULL,
        status CHAR DEFAULT 'A' NOT NULL
      )`, (err) => {
        if (err) return console.error('Error creating config_headers table:', err.message);
        db.get('SELECT COUNT(*) AS count FROM config_headers', (err, row) => {
          if (err) return console.error('Error checking config headers count:', err.message);
          if (row.count === 0) {
            const initialConfigs = [
              { code: 'PROD_TYPE', desc_en: 'Product Type', desc_te: 'ఉత్పత్తి రకం' },
              { code: 'ORDER_STATUS', desc_en: 'Order Status', desc_te: 'ఆర్డర్ స్థితి' },
              { code: 'USER_ROLE', desc_en: 'User Role', desc_te: 'వినియోగదారు పాత్ర' },
            ];
            const createdDate = new Date().toISOString();
            const stmt = db.prepare(`INSERT INTO config_headers (category_code, category_description_english, category_description_telugu, created_date) VALUES (?, ?, ?, ?)`);
            initialConfigs.forEach((c) => {
              stmt.run(c.code, c.desc_en, c.desc_te, createdDate, (err) => {
                if (err) console.error('Error inserting initial config header:', err.message);
              });
            });
            stmt.finalize(() => console.log('Initial config headers inserted.'));
          }
        });
      });
    });
  }
});

module.exports = db;
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const email = (process.env.ADMIN_EMAIL || 'admin@fbcsunset.org').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
const name = process.env.ADMIN_NAME || 'Church Admin';
const hash = bcrypt.hashSync(password, 10);

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

if (existing) {
  db.prepare('UPDATE users SET password_hash = ?, name = ?, role = ? WHERE id = ?').run(
    hash,
    name,
    'admin',
    existing.id
  );
  console.log(`Reset admin password for: ${email}`);
} else {
  db.prepare(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
  ).run(email, hash, name, 'admin');
  console.log(`Created admin user: ${email}`);
}

console.log('Admin login is ready. Use the credentials from your .env file.');

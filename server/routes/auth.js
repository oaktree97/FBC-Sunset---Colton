const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000,
  });
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db
    .prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

router.get('/users', requireAuth, requireRole('admin'), (_req, res) => {
  const users = db
    .prepare('SELECT id, email, name, role, created_at FROM users ORDER BY name')
    .all();
  res.json({ users });
});

router.post('/users', requireAuth, requireRole('admin'), (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (!['admin', 'editor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db
      .prepare(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
      )
      .run(email.toLowerCase(), hash, name, role);
    const user = db
      .prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json({ user });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    throw e;
  }
});

router.put('/users/:id', requireAuth, requireRole('admin'), (req, res) => {
  const { name, role, password } = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  if (role && !['admin', 'editor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const newName = name ?? existing.name;
  const newRole = role ?? existing.role;

  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET name = ?, role = ?, password_hash = ? WHERE id = ?').run(
      newName,
      newRole,
      hash,
      req.params.id
    );
  } else {
    db.prepare('UPDATE users SET name = ?, role = ? WHERE id = ?').run(
      newName,
      newRole,
      req.params.id
    );
  }

  const user = db
    .prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?')
    .get(req.params.id);
  res.json({ user });
});

router.delete('/users/:id', requireAuth, requireRole('admin'), (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true });
});

module.exports = router;

const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (_req, res) => {
  const staff = db
    .prepare(
      `SELECT s.*, p.filename AS photo_filename, p.alt_text AS photo_alt
       FROM staff s LEFT JOIN photos p ON s.photo_id = p.id
       ORDER BY s.is_elder ASC, s.sort_order ASC, s.id ASC`
    )
    .all();
  res.json({ staff });
});

router.get('/featured', (_req, res) => {
  const member = db
    .prepare(
      `SELECT s.*, p.filename AS photo_filename, p.alt_text AS photo_alt
       FROM staff s LEFT JOIN photos p ON s.photo_id = p.id
       WHERE s.is_featured = 1 LIMIT 1`
    )
    .get();
  res.json({ staff: member || null });
});

router.post('/', requireAuth, (req, res) => {
  const { name, role, bio, photo_id, is_featured, is_elder, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  if (is_featured) {
    db.prepare('UPDATE staff SET is_featured = 0').run();
  }

  const result = db
    .prepare(
      `INSERT INTO staff (name, role, bio, photo_id, is_featured, is_elder, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      name,
      role || '',
      bio || '',
      photo_id || null,
      is_featured ? 1 : 0,
      is_elder ? 1 : 0,
      sort_order ?? 0
    );
  const member = db.prepare('SELECT * FROM staff WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ staff: member });
});

router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Staff member not found' });

  const { name, role, bio, photo_id, is_featured, is_elder, sort_order } = req.body;

  if (is_featured) {
    db.prepare('UPDATE staff SET is_featured = 0').run();
  }

  db.prepare(
    `UPDATE staff SET name = ?, role = ?, bio = ?, photo_id = ?,
     is_featured = ?, is_elder = ?, sort_order = ? WHERE id = ?`
  ).run(
    name ?? existing.name,
    role ?? existing.role,
    bio ?? existing.bio,
    photo_id !== undefined ? photo_id : existing.photo_id,
    is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
    is_elder !== undefined ? (is_elder ? 1 : 0) : existing.is_elder,
    sort_order ?? existing.sort_order,
    req.params.id
  );
  const member = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  res.json({ staff: member });
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Staff member not found' });
  res.json({ ok: true });
});

module.exports = router;

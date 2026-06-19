const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Public
router.get('/', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const events = db
    .prepare(
      `SELECT * FROM events WHERE event_date >= ? ORDER BY event_date ASC, event_time ASC`
    )
    .all(today);
  res.json({ events });
});

// Admin
router.get('/all', requireAuth, (_req, res) => {
  const events = db
    .prepare('SELECT * FROM events ORDER BY event_date DESC')
    .all();
  res.json({ events });
});

router.post('/', requireAuth, (req, res) => {
  const { title, event_date, event_time, location, description } = req.body;
  if (!title || !event_date) {
    return res.status(400).json({ error: 'Title and date required' });
  }
  const result = db
    .prepare(
      `INSERT INTO events (title, event_date, event_time, location, description)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(title, event_date, event_time || '', location || '', description || '');
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ event });
});

router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  const { title, event_date, event_time, location, description } = req.body;
  db.prepare(
    `UPDATE events SET title = ?, event_date = ?, event_time = ?, location = ?,
     description = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    title ?? existing.title,
    event_date ?? existing.event_date,
    event_time ?? existing.event_time,
    location ?? existing.location,
    description ?? existing.description,
    req.params.id
  );
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json({ event });
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Event not found' });
  res.json({ ok: true });
});

module.exports = router;
module.exports.slugify = slugify;

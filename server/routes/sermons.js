const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (_req, res) => {
  const sermons = db
    .prepare('SELECT * FROM sermons ORDER BY sort_order ASC, sermon_date DESC, id DESC')
    .all();
  res.json({ sermons });
});

router.post('/', requireAuth, (req, res) => {
  const { title, youtube_id, notes, sermon_date, sort_order } = req.body;
  if (!youtube_id) return res.status(400).json({ error: 'YouTube ID required' });

  const id = youtube_id.replace(/.*(?:youtu\.be\/|v=)([^&?/]+).*/, '$1');

  const result = db
    .prepare(
      `INSERT INTO sermons (title, youtube_id, notes, sermon_date, sort_order)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(title || '', id, notes || '', sermon_date || '', sort_order ?? 0);
  const sermon = db.prepare('SELECT * FROM sermons WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ sermon });
});

router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM sermons WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Sermon not found' });

  let { title, youtube_id, notes, sermon_date, sort_order } = req.body;
  if (youtube_id) {
    youtube_id = youtube_id.replace(/.*(?:youtu\.be\/|v=)([^&?/]+).*/, '$1');
  }

  db.prepare(
    `UPDATE sermons SET title = ?, youtube_id = ?, notes = ?, sermon_date = ?, sort_order = ?
     WHERE id = ?`
  ).run(
    title ?? existing.title,
    youtube_id ?? existing.youtube_id,
    notes ?? existing.notes,
    sermon_date ?? existing.sermon_date,
    sort_order ?? existing.sort_order,
    req.params.id
  );
  const sermon = db.prepare('SELECT * FROM sermons WHERE id = ?').get(req.params.id);
  res.json({ sermon });
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM sermons WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Sermon not found' });
  res.json({ ok: true });
});

module.exports = router;

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

router.get('/', (_req, res) => {
  const announcements = db
    .prepare(
      `SELECT id, title, slug, excerpt, author, published, published_at, created_at
       FROM announcements WHERE published = 1
       ORDER BY published_at DESC, created_at DESC`
    )
    .all();
  res.json({ announcements });
});

router.get('/all', requireAuth, (_req, res) => {
  const announcements = db
    .prepare('SELECT * FROM announcements ORDER BY created_at DESC')
    .all();
  res.json({ announcements });
});

router.get('/slug/:slug', (req, res) => {
  const announcement = db
    .prepare('SELECT * FROM announcements WHERE slug = ? AND published = 1')
    .get(req.params.slug);
  if (!announcement) return res.status(404).json({ error: 'Not found' });
  res.json({ announcement });
});

router.post('/', requireAuth, (req, res) => {
  const { title, slug, excerpt, content, author, published } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const finalSlug = slug || slugify(title);
  const isPublished = published ? 1 : 0;
  const publishedAt = isPublished ? new Date().toISOString() : null;

  try {
    const result = db
      .prepare(
        `INSERT INTO announcements (title, slug, excerpt, content, author, published, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        title,
        finalSlug,
        excerpt || '',
        content || '',
        author || 'FBC Sunset',
        isPublished,
        publishedAt
      );
    const announcement = db
      .prepare('SELECT * FROM announcements WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json({ announcement });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    throw e;
  }
});

router.put('/:id', requireAuth, (req, res) => {
  const existing = db
    .prepare('SELECT * FROM announcements WHERE id = ?')
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { title, slug, excerpt, content, author, published } = req.body;
  const isPublished = published !== undefined ? (published ? 1 : 0) : existing.published;
  let publishedAt = existing.published_at;
  if (published !== undefined && published && !existing.published) {
    publishedAt = new Date().toISOString();
  }

  try {
    db.prepare(
      `UPDATE announcements SET title = ?, slug = ?, excerpt = ?, content = ?,
       author = ?, published = ?, published_at = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      title ?? existing.title,
      slug ?? existing.slug,
      excerpt ?? existing.excerpt,
      content ?? existing.content,
      author ?? existing.author,
      isPublished,
      publishedAt,
      req.params.id
    );
    const announcement = db
      .prepare('SELECT * FROM announcements WHERE id = ?')
      .get(req.params.id);
    res.json({ announcement });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    throw e;
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;

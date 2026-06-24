const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (_req, res) => {
  const homepage = db.prepare('SELECT * FROM homepage WHERE id = 1').get();
  const featuredPhoto = homepage?.featured_photo_id
    ? db.prepare('SELECT * FROM photos WHERE id = ?').get(homepage.featured_photo_id)
    : null;
  const heroPhoto = homepage?.hero_photo_id
    ? db.prepare('SELECT * FROM photos WHERE id = ?').get(homepage.hero_photo_id)
    : null;
  res.json({ homepage: homepage || {}, featured_photo: featuredPhoto, hero_photo: heroPhoto });
});

router.put('/', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM homepage WHERE id = 1').get();
  const fields = [
    'hero_title', 'hero_subtitle', 'tagline', 'hero_photo_id',
    'hero_cta_primary_text', 'hero_cta_primary_url',
    'hero_cta_secondary_text', 'hero_cta_secondary_url',
    'find_us_title', 'find_us_text',
    'ministries_title', 'ministries_intro', 'kids_title', 'kids_text',
    'students_title', 'students_text', 'address', 'phone', 'email',
    'giving_url', 'featured_photo_id',
  ];

  const values = fields.map((f) => {
    let value = req.body[f] !== undefined ? req.body[f] : existing?.[f] ?? '';
    if (f.endsWith('_photo_id') && (value === '' || value === undefined)) value = null;
    return value;
  });

  if (existing) {
    db.prepare(
      `UPDATE homepage SET hero_title = ?, hero_subtitle = ?, tagline = ?, hero_photo_id = ?,
       hero_cta_primary_text = ?, hero_cta_primary_url = ?,
       hero_cta_secondary_text = ?, hero_cta_secondary_url = ?,
       find_us_title = ?, find_us_text = ?, ministries_title = ?, ministries_intro = ?,
       kids_title = ?, kids_text = ?, students_title = ?, students_text = ?,
       address = ?, phone = ?, email = ?, giving_url = ?, featured_photo_id = ?,
       updated_at = datetime('now') WHERE id = 1`
    ).run(...values);
  } else {
    db.prepare(
      `INSERT INTO homepage (id, hero_title, hero_subtitle, tagline, hero_photo_id,
       hero_cta_primary_text, hero_cta_primary_url, hero_cta_secondary_text, hero_cta_secondary_url,
       find_us_title, find_us_text, ministries_title, ministries_intro, kids_title, kids_text,
       students_title, students_text, address, phone, email, giving_url,
       featured_photo_id, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(...values);
  }

  const homepage = db.prepare('SELECT * FROM homepage WHERE id = 1').get();
  res.json({ homepage });
});

router.get('/ministries', (_req, res) => {
  const page = db.prepare('SELECT * FROM ministries_page WHERE id = 1').get();
  res.json({ ministries: page || {} });
});

router.put('/ministries', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM ministries_page WHERE id = 1').get();
  const fields = [
    'kids_title', 'kids_content', 'students_title', 'students_content',
    'contact_name', 'contact_note',
  ];
  const values = fields.map((f) =>
    req.body[f] !== undefined ? req.body[f] : existing?.[f] ?? ''
  );

  if (existing) {
    db.prepare(
      `UPDATE ministries_page SET kids_title = ?, kids_content = ?,
       students_title = ?, students_content = ?, contact_name = ?, contact_note = ?
       WHERE id = 1`
    ).run(...values);
  } else {
    db.prepare(
      `INSERT INTO ministries_page (id, kids_title, kids_content, students_title,
       students_content, contact_name, contact_note) VALUES (1, ?, ?, ?, ?, ?, ?)`
    ).run(...values);
  }

  const page = db.prepare('SELECT * FROM ministries_page WHERE id = 1').get();
  res.json({ ministries: page });
});

module.exports = router;

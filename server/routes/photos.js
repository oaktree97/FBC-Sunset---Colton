const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.get('/', (_req, res) => {
  const photos = db.prepare('SELECT * FROM photos ORDER BY created_at DESC').all();
  res.json({ photos });
});

router.post('/', requireAuth, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { alt_text, category } = req.body;
  const result = db
    .prepare(
      `INSERT INTO photos (filename, original_name, alt_text, category)
       VALUES (?, ?, ?, ?)`
    )
    .run(
      req.file.filename,
      req.file.originalname,
      alt_text || '',
      category || 'general'
    );
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ photo });
});

router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Photo not found' });
  const { alt_text, category } = req.body;
  db.prepare('UPDATE photos SET alt_text = ?, category = ? WHERE id = ?').run(
    alt_text ?? existing.alt_text,
    category ?? existing.category,
    req.params.id
  );
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  res.json({ photo });
});

router.delete('/:id', requireAuth, requireRole('admin'), (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  const filePath = path.join(uploadDir, photo.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

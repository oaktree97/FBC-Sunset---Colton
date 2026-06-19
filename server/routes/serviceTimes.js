const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', (_req, res) => {
  const times = db
    .prepare('SELECT * FROM service_times ORDER BY sort_order ASC, id ASC')
    .all();
  res.json({ service_times: times });
});

router.put('/', requireAuth, (req, res) => {
  const { service_times } = req.body;
  if (!Array.isArray(service_times)) {
    return res.status(400).json({ error: 'service_times array required' });
  }

  const insert = db.prepare(
    'INSERT INTO service_times (label, time, sort_order) VALUES (?, ?, ?)'
  );
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM service_times').run();
    items.forEach((item, i) => {
      insert.run(item.label, item.time, item.sort_order ?? i);
    });
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const times = db
    .prepare('SELECT * FROM service_times ORDER BY sort_order ASC, id ASC')
    .all();
  res.json({ service_times: times });
});

module.exports = router;

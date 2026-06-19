const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'fbc.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'editor')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_time TEXT,
    location TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT,
    alt_text TEXT,
    category TEXT DEFAULT 'general',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS service_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    time TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    bio TEXT,
    photo_id INTEGER REFERENCES photos(id) ON DELETE SET NULL,
    is_featured INTEGER DEFAULT 0,
    is_elder INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sermons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    youtube_id TEXT NOT NULL,
    notes TEXT,
    sermon_date TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    excerpt TEXT,
    content TEXT,
    author TEXT DEFAULT 'FBC Sunset',
    published INTEGER DEFAULT 0,
    published_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS homepage (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    hero_title TEXT,
    hero_subtitle TEXT,
    tagline TEXT,
    find_us_title TEXT,
    find_us_text TEXT,
    ministries_title TEXT,
    ministries_intro TEXT,
    kids_title TEXT,
    kids_text TEXT,
    students_title TEXT,
    students_text TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    giving_url TEXT,
    featured_photo_id INTEGER REFERENCES photos(id) ON DELETE SET NULL,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS ministries_page (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    kids_title TEXT,
    kids_content TEXT,
    students_title TEXT,
    students_content TEXT,
    contact_name TEXT,
    contact_note TEXT
  );
`);

module.exports = db;

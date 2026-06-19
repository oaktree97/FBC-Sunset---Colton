require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const email = process.env.ADMIN_EMAIL || 'admin@fbcsunset.org';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.ADMIN_NAME || 'Church Admin';
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
  ).run(email, hash, name, 'admin');
  console.log(`Created admin user: ${email}`);
}

if (db.prepare('SELECT COUNT(*) AS c FROM service_times').get().c === 0) {
  const insert = db.prepare(
    'INSERT INTO service_times (label, time, sort_order) VALUES (?, ?, ?)'
  );
  insert.run('Bible Study', '9:45 AM', 0);
  insert.run('Worship Service', '10:30 AM', 1);
}

if (!db.prepare('SELECT id FROM homepage WHERE id = 1').get()) {
  db.prepare(
    `INSERT INTO homepage (id, hero_title, hero_subtitle, tagline, find_us_title, find_us_text,
     ministries_title, ministries_intro, kids_title, kids_text, students_title, students_text,
     address, phone, email, giving_url, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(
    'Welcome to the Family',
    'First Baptist Church, Sunset, Texas',
    'Your place for discipleship',
    'Find Us in Sunset',
    "We're a small-town church with a heart for our neighbors. Whether you're new to the area or looking for a church home, we invite you to come see what God is doing in our community.",
    'Family Ministries',
    "From our youngest to our teenagers, we're committed to pointing every generation to Jesus.",
    'Sunset Kids',
    'Our kids deserve to be taught the truth of the gospel in new, fun, and exciting ways. We walk alongside families as they point each other to Jesus.',
    'Sunset Students',
    'We believe in the generation rising. A safe place for students to come, connect, and be fully known and fully loved as they discover who they are in Christ.',
    '407 TX-511 Spur, Sunset, TX 76270',
    '940-600-8164',
    'thefbcsunsettx@gmail.com',
    ''
  );
}

if (!db.prepare('SELECT id FROM ministries_page WHERE id = 1').get()) {
  db.prepare(
    `INSERT INTO ministries_page (id, kids_title, kids_content, students_title, students_content,
     contact_name, contact_note) VALUES (1, ?, ?, ?, ?, ?, ?)`
  ).run(
    'Sunset Kids',
    'At FBC Sunset we believe our kids deserve to be taught the truth of the gospel in new, fun, and exciting ways. Our prayer is that we can walk alongside families as they point each other to Jesus and that kids will go home begging to come back week after week!\n\nWe provide a safe, engaging environment where children can learn about God\'s love through Bible stories, activities, and worship designed just for them.',
    'Sunset Students',
    'We believe in the generation rising. We hope to provide a safe place for all students to come, connect, and be fully known and fully loved. Our goal is to facilitate a fun environment to discover Jesus and who we are in Him.\n\nMiddle school and high school students are welcome to join us for weekly gatherings, events, and opportunities to grow in faith and friendship.',
    'Randall Templin',
    'Lead Pastor / Family Ministries Director'
  );
}

if (db.prepare('SELECT COUNT(*) AS c FROM staff').get().c === 0) {
  const insert = db.prepare(
    `INSERT INTO staff (name, role, bio, is_featured, is_elder, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
  );
  insert.run(
    'Randall & Ryan Templin',
    'Lead Pastor / Family Ministries Director',
    'Pastor Randall was born and raised in Lewisville, Texas. He has been in ministry for over 10 years. He has a heart to see people step into their calling and to truly disciple people well. Randall is married to his wife Ryan of 7 years and they have a beautiful little girl named Everly. He loves his family and sees them as his number one ministry.',
    1, 0, 0
  );
  insert.run('David Herring', 'Youth Pastor', '', 0, 0, 1);
  insert.run('Barbara Pellet', 'Worship', '', 0, 0, 2);
  insert.run('Shannon & Eddie Cashion', 'Tech / Grounds Keeper', '', 0, 0, 3);
  insert.run('Donna Hooten', 'Financial Secretary', '', 0, 0, 4);
  insert.run('Biff Huddleston', 'Elder', '', 0, 1, 5);
  insert.run('James Capps', 'Elder', '', 0, 1, 6);
  insert.run('Jeff Jackson', 'Elder', '', 0, 1, 7);
}

if (db.prepare('SELECT COUNT(*) AS c FROM events').get().c === 0) {
  const insert = db.prepare(
    `INSERT INTO events (title, event_date, event_time, location, description) VALUES (?, ?, ?, ?, ?)`
  );
  insert.run(
    'Sunday Worship Service', '2026-06-22', '10:30 AM', 'FBC Sunset Sanctuary',
    'Join us for Bible study at 9:45 AM followed by worship at 10:30 AM. All are welcome!'
  );
  insert.run(
    'Sunset Students Night', '2026-06-25', '6:30 PM', 'FBC Sunset',
    "Students gather for fellowship, games, and a time in God's Word. Middle and high school welcome."
  );
}

if (db.prepare('SELECT COUNT(*) AS c FROM announcements').get().c === 0) {
  db.prepare(
    `INSERT INTO announcements (title, slug, excerpt, content, author, published, published_at)
     VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`
  ).run(
    'Welcome to Our New Website',
    'welcome',
    "We're glad you're here. Welcome to the family at First Baptist Church Sunset.",
    "## Hello, Friend!\n\nWe're so glad you've found us online. First Baptist Church Sunset is a small-town church with a big heart for our community and for Jesus.\n\nWhether you're visiting for the first time or you've been part of our family for years, we hope this site helps you stay connected with what's happening here in Sunset, Texas.\n\n### Plan a Visit\n\nWe'd love to meet you in person! Join us on Sundays for Bible study at **9:45 AM** and worship at **10:30 AM**.\n\n407 TX-511 Spur, Sunset, TX 76270\n\nSee you soon!",
    'FBC Sunset'
  );
}

if (db.prepare('SELECT COUNT(*) AS c FROM sermons').get().c === 0) {
  const ids = [
    '8g3XTFruolM', 'irCtjV3kHmI', '4K3_ixsQkPc', '2b5W_8Zimpk',
    'DwGjuspfnRU', '4JQAYxMEpwo', 'zeT5XS5Hy_U', 'pHGTqIXRy_o', 'Ae6vFJMH1Ig',
  ];
  const insert = db.prepare(
    'INSERT INTO sermons (youtube_id, sort_order) VALUES (?, ?)'
  );
  ids.forEach((id, i) => insert.run(id, i));
}

const churchPhoto = path.join(__dirname, '..', 'images', 'church-building.png');
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

if (db.prepare('SELECT COUNT(*) AS c FROM photos').get().c === 0 && fs.existsSync(churchPhoto)) {
  const dest = path.join(uploadsDir, 'church-building.png');
  if (!fs.existsSync(dest)) fs.copyFileSync(churchPhoto, dest);
  const result = db.prepare(
    `INSERT INTO photos (filename, original_name, alt_text, category) VALUES (?, ?, ?, ?)`
  ).run(
    'church-building.png',
    'church-building.png',
    'First Baptist Church Sunset building with white steeple and cross on the front facade',
    'building'
  );
  db.prepare('UPDATE homepage SET featured_photo_id = ? WHERE id = 1').run(result.lastInsertRowid);
}

console.log('Database seeded successfully.');

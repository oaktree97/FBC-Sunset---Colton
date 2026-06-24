require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

require('./db');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const photosRoutes = require('./routes/photos');
const serviceTimesRoutes = require('./routes/serviceTimes');
const staffRoutes = require('./routes/staff');
const sermonsRoutes = require('./routes/sermons');
const announcementsRoutes = require('./routes/announcements');
const homepageRoutes = require('./routes/homepage');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const root = path.join(__dirname, '..');

app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.join(root, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/service-times', serviceTimesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/sermons', sermonsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/homepage', homepageRoutes);

app.use(express.static(root));

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(root, 'admin', 'index.html'));
});

app.get('/admin/*', (_req, res) => {
  res.sendFile(path.join(root, 'admin', 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`FBC Sunset running at http://localhost:${PORT}`);
  console.log(`Admin portal: http://localhost:${PORT}/admin`);
});

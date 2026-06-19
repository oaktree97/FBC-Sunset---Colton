const API_BASE = '/api';

async function fetchPublic(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function photoUrl(filename) {
  return filename ? `/uploads/${filename}` : null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return { month: '', day: '' };
  const date = new Date(dateStr + 'T00:00:00');
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: date.getDate(),
  };
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/blog/')) return '../';
  return '';
}

function getPostUrl(slug) {
  const inBlog = window.location.pathname.includes('/blog/');
  const prefix = inBlog ? '' : getBasePath() + 'blog/';
  return `${prefix}post.html?slug=${encodeURIComponent(slug)}`;
}

window.SiteAPI = { fetchPublic, photoUrl, formatDate, formatShortDate, esc, getBasePath, getPostUrl };

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.setAttribute(
        'aria-expanded',
        nav.classList.contains('open')
      );
    });

    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const path = window.location.pathname;
  const currentPage = path.split('/').pop() || 'index.html';
  const inBlog = path.includes('/blog/');

  document.querySelectorAll('.main-nav a').forEach((link) => {
    const href = link.getAttribute('href');
    const isHome =
      href === 'index.html' &&
      (currentPage === 'index.html' || currentPage === '');
    const isBlog =
      inBlog && (href === 'index.html' || href.endsWith('/blog/index.html'));
    const isMatch = href === currentPage || isHome || isBlog;

    if (isMatch) {
      link.classList.add('active');
    }
  });
});

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: date.getDate(),
  };
}

async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/blog/')) return '../';
  return '';
}

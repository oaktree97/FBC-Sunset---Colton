async function loadBlogPosts() {
  const base = getBasePath();
  const data = await fetchJSON(`${base}blog/posts.json`);
  return (data.posts || []).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
}

async function loadEvents() {
  const base = getBasePath();
  const data = await fetchJSON(`${base}data/events.json`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (data.events || [])
    .filter((e) => new Date(e.date + 'T00:00:00') >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getPostUrl(slug) {
  const inBlog = window.location.pathname.includes('/blog/');
  const prefix = inBlog ? '' : getBasePath() + 'blog/';
  return `${prefix}post.html?slug=${encodeURIComponent(slug)}`;
}

function renderBlogCards(posts, container, limit) {
  const items = limit ? posts.slice(0, limit) : posts;

  if (items.length === 0) {
    container.innerHTML =
      '<p class="empty-state">No blog posts yet. Check back soon!</p>';
    return;
  }

  container.innerHTML = items
    .map(
      (post) => `
    <article class="card">
      <p class="card-meta">${formatDate(post.date)} · ${post.author}</p>
      <h3>${post.title}</h3>
      <p>${post.excerpt}</p>
      <a class="card-link" href="${getPostUrl(post.slug)}">Read more →</a>
    </article>
  `
    )
    .join('');
}

function renderEventCard(event) {
  const { month, day } = formatShortDate(event.date);
  return `
    <div class="event-card">
      <div class="event-date">
        <div class="month">${month}</div>
        <div class="day">${day}</div>
      </div>
      <div class="event-details">
        <h3>${event.title}</h3>
        <p class="event-meta">${event.time} · ${event.location}</p>
        <p>${event.description}</p>
      </div>
    </div>
  `;
}

function renderEventsList(events, container) {
  if (events.length === 0) {
    container.innerHTML =
      '<p class="empty-state">No upcoming events at this time. Check back soon!</p>';
    return;
  }

  container.innerHTML = events.map(renderEventCard).join('');
}

async function renderBlogIndex() {
  const container = document.getElementById('blog-list');
  if (!container) return;

  try {
    const posts = await loadBlogPosts();
    renderBlogCards(posts, container);
  } catch {
    container.innerHTML =
      '<p class="empty-state">Unable to load blog posts.</p>';
  }
}

async function renderBlogPost() {
  const container = document.getElementById('post-content');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    container.innerHTML =
      '<p class="empty-state">Post not found. <a href="index.html">Back to blog</a></p>';
    return;
  }

  try {
    const posts = await loadBlogPosts();
    const post = posts.find((p) => p.slug === slug);

    if (!post) {
      container.innerHTML =
        '<p class="empty-state">Post not found. <a href="index.html">Back to blog</a></p>';
      return;
    }

    document.title = `${post.title} | FBC Sunset Blog`;

    container.innerHTML = `
      <header class="post-header">
        <h1>${post.title}</h1>
        <p class="post-meta">${formatDate(post.date)} · ${post.author}</p>
      </header>
      <div class="blog-content">${marked.parse(post.content)}</div>
      <p style="margin-top: 2rem;"><a href="index.html">← Back to blog</a></p>
    `;
  } catch {
    container.innerHTML =
      '<p class="empty-state">Unable to load this post.</p>';
  }
}

async function renderHomePreviews() {
  const blogPreview = document.getElementById('blog-preview');
  const eventPreview = document.getElementById('event-preview');

  if (blogPreview) {
    try {
      const posts = await loadBlogPosts();
      renderBlogCards(posts, blogPreview, 1);
    } catch {
      blogPreview.innerHTML =
        '<p class="empty-state">Unable to load latest post.</p>';
    }
  }

  if (eventPreview) {
    try {
      const events = await loadEvents();
      if (events.length === 0) {
        eventPreview.innerHTML =
          '<p class="empty-state">No upcoming events. Check back soon!</p>';
      } else {
        eventPreview.innerHTML = renderEventCard(events[0]);
      }
    } catch {
      eventPreview.innerHTML =
        '<p class="empty-state">Unable to load events.</p>';
    }
  }
}

async function renderEventsPage() {
  const container = document.getElementById('events-list');
  if (!container) return;

  try {
    const events = await loadEvents();
    renderEventsList(events, container);
  } catch {
    container.innerHTML =
      '<p class="empty-state">Unable to load events.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderBlogIndex();
  renderBlogPost();
  renderHomePreviews();
  renderEventsPage();
});

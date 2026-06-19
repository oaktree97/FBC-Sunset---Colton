const { fetchPublic, photoUrl, formatDate, formatShortDate, esc, getBasePath, getPostUrl } = window.SiteAPI;

async function loadSiteSettings() {
  try {
    const [{ homepage }, { service_times }] = await Promise.all([
      fetchPublic('/homepage'),
      fetchPublic('/service-times'),
    ]);
    if (homepage.tagline) {
      document.querySelectorAll('.logo-tagline').forEach((el) => {
        el.textContent = homepage.tagline;
      });
    }
    document.querySelectorAll('[data-footer-service-times]').forEach((el) => {
      el.innerHTML = service_times.map((t) => `${esc(t.label)}: ${esc(t.time)}`).join('<br>');
    });
    return homepage;
  } catch {
    return null;
  }
}

async function renderHomepage() {
  const heroTitle = document.querySelector('[data-hero-title]');
  if (!heroTitle) return;

  try {
    const [{ homepage, featured_photo }, { service_times }, { events }, { announcements }] = await Promise.all([
      fetchPublic('/homepage'),
      fetchPublic('/service-times'),
      fetchPublic('/events'),
      fetchPublic('/announcements'),
    ]);

    document.querySelector('[data-hero-title]').textContent = homepage.hero_title || 'Welcome to the Family';
    document.querySelector('[data-hero-subtitle]').textContent = homepage.hero_subtitle || '';
    document.querySelector('[data-find-us-title]').textContent = homepage.find_us_title || 'Find Us in Sunset';
    document.querySelector('[data-find-us-text]').textContent = homepage.find_us_text || '';
    document.querySelector('[data-ministries-title]').textContent = homepage.ministries_title || 'Family Ministries';
    document.querySelector('[data-ministries-intro]').textContent = homepage.ministries_intro || '';

    const phoneEl = document.querySelector('[data-contact-phone]');
    const emailEl = document.querySelector('[data-contact-email]');
    if (phoneEl) { phoneEl.href = `tel:${(homepage.phone || '').replace(/\D/g, '')}`; phoneEl.textContent = homepage.phone; }
    if (emailEl) { emailEl.href = `mailto:${homepage.email}`; emailEl.textContent = homepage.email; }

    document.querySelectorAll('[data-site-address]').forEach((el) => {
      if (el.tagName === 'FIGCAPTION') el.textContent = homepage.address || '';
      else el.innerHTML = (homepage.address || '').replace(', ', '<br>');
    });
    document.querySelectorAll('[data-site-phone]').forEach((el) => { el.textContent = homepage.phone; el.href = `tel:${(homepage.phone || '').replace(/\D/g, '')}`; });
    document.querySelectorAll('[data-site-email]').forEach((el) => { el.textContent = homepage.email; el.href = `mailto:${homepage.email}`; });

    const kidsCard = document.querySelector('[data-kids-card]');
    const studentsCard = document.querySelector('[data-students-card]');
    if (kidsCard) {
      kidsCard.querySelector('h3').textContent = homepage.kids_title || 'Sunset Kids';
      kidsCard.querySelector('p').textContent = homepage.kids_text || '';
    }
    if (studentsCard) {
      studentsCard.querySelector('h3').textContent = homepage.students_title || 'Sunset Students';
      studentsCard.querySelector('p').textContent = homepage.students_text || '';
    }

    const stGrid = document.querySelector('[data-service-times]');
    if (stGrid) {
      stGrid.innerHTML = service_times.map((t) => `
        <div class="info-block">
          <div class="icon">${t.label.toLowerCase().includes('bible') ? '📖' : '🎵'}</div>
          <h3>${esc(t.label)}</h3>
          <p>${esc(t.time)}</p>
        </div>`).join('');
    }

    const photoEl = document.querySelector('[data-church-photo]');
    if (photoEl && featured_photo) {
      photoEl.src = photoUrl(featured_photo.filename);
      photoEl.alt = featured_photo.alt_text || 'First Baptist Church Sunset';
    }

    const eventPreview = document.getElementById('event-preview');
    if (eventPreview) {
      if (events.length === 0) {
        eventPreview.innerHTML = '<p class="empty-state">No upcoming events. Check back soon!</p>';
      } else {
        const ev = events[0];
        const { month, day } = formatShortDate(ev.event_date);
        eventPreview.innerHTML = `
          <div class="event-card">
            <div class="event-date"><div class="month">${month}</div><div class="day">${day}</div></div>
            <div class="event-details">
              <h3>${esc(ev.title)}</h3>
              <p class="event-meta">${esc(ev.event_time)} · ${esc(ev.location)}</p>
              <p>${esc(ev.description)}</p>
            </div>
          </div>`;
      }
    }

    const blogPreview = document.getElementById('blog-preview');
    if (blogPreview) {
      if (announcements.length === 0) {
        blogPreview.innerHTML = '<p class="empty-state">No posts yet. Check back soon!</p>';
      } else {
        const post = announcements[0];
        blogPreview.innerHTML = `
          <article class="card">
            <p class="card-meta">${formatDate(post.published_at?.slice(0, 10) || post.created_at?.slice(0, 10))} · ${esc(post.author)}</p>
            <h3>${esc(post.title)}</h3>
            <p>${esc(post.excerpt)}</p>
            <a class="card-link" href="${getPostUrl(post.slug)}">Read more →</a>
          </article>`;
      }
    }
  } catch (e) {
    console.warn('Could not load homepage content', e);
  }
}

async function renderEventsPage() {
  const container = document.getElementById('events-list');
  if (!container) return;
  try {
    const { events } = await fetchPublic('/events');
    if (events.length === 0) {
      container.innerHTML = '<p class="empty-state">No upcoming events at this time. Check back soon!</p>';
      return;
    }
    container.innerHTML = events.map((ev) => {
      const { month, day } = formatShortDate(ev.event_date);
      return `
        <div class="event-card">
          <div class="event-date"><div class="month">${month}</div><div class="day">${day}</div></div>
          <div class="event-details">
            <h3>${esc(ev.title)}</h3>
            <p class="event-meta">${esc(ev.event_time)} · ${esc(ev.location)}</p>
            <p>${esc(ev.description)}</p>
          </div>
        </div>`;
    }).join('');
  } catch {
    container.innerHTML = '<p class="empty-state">Unable to load events.</p>';
  }
}

async function renderStaffPage() {
  const featuredEl = document.getElementById('featured-staff');
  const teamEl = document.getElementById('staff-team');
  const eldersEl = document.getElementById('staff-elders');
  if (!teamEl) return;

  try {
    const { staff } = await fetchPublic('/staff');
    const featured = staff.find((s) => s.is_featured);
    const team = staff.filter((s) => !s.is_elder && !s.is_featured);
    const elders = staff.filter((s) => s.is_elder);

    if (featuredEl && featured) {
      featuredEl.innerHTML = `
        <div class="staff-bio">
          <h2>${esc(featured.name)}</h2>
          <p class="staff-role">${esc(featured.role)}</p>
          <p style="margin-top:1rem;">${esc(featured.bio)}</p>
        </div>`;
    }

    teamEl.innerHTML = team.map(staffCard).join('');
    if (eldersEl) eldersEl.innerHTML = elders.map(staffCard).join('');
  } catch {
    teamEl.innerHTML = '<p class="empty-state">Unable to load staff.</p>';
  }
}

function staffCard(s) {
  const img = s.photo_filename
    ? `<img src="${photoUrl(s.photo_filename)}" alt="${esc(s.photo_alt || s.name)}" style="width:100%;height:100%;object-fit:cover;">`
    : '✝';
  return `
    <article class="staff-card">
      <div class="staff-photo">${img}</div>
      <div class="staff-info">
        <h3>${esc(s.name)}</h3>
        <p class="staff-role">${esc(s.role)}</p>
      </div>
    </article>`;
}

async function renderSermonsPage() {
  const grid = document.getElementById('sermon-grid');
  if (!grid) return;
  try {
    const { sermons } = await fetchPublic('/sermons');
    grid.innerHTML = sermons.map((s) => `
      <a href="https://www.youtube.com/watch?v=${esc(s.youtube_id)}" target="_blank" rel="noopener noreferrer" class="sermon-card">
        <div class="sermon-thumb">
          <img src="https://img.youtube.com/vi/${esc(s.youtube_id)}/hqdefault.jpg" alt="${esc(s.title || 'Sermon')}">
          <span class="play-icon">▶</span>
        </div>
        ${s.title ? `<div style="padding:1rem;"><h3 style="font-size:1rem;">${esc(s.title)}</h3>${s.notes ? `<p style="font-size:0.875rem;color:var(--color-text-muted);margin-top:0.35rem;">${esc(s.notes.slice(0, 120))}${s.notes.length > 120 ? '…' : ''}</p>` : ''}</div>` : ''}
      </a>`).join('');
  } catch {
    grid.innerHTML = '<p class="empty-state">Unable to load sermons.</p>';
  }
}

async function renderMinistriesPage() {
  const kidsEl = document.getElementById('ministry-kids');
  if (!kidsEl) return;
  try {
    const { ministries } = await fetchPublic('/homepage/ministries');
    const { homepage } = await fetchPublic('/homepage');
    document.getElementById('ministry-kids-title').textContent = ministries.kids_title || 'Sunset Kids';
    document.getElementById('ministry-kids-content').innerHTML = (ministries.kids_content || '').split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('');
    document.getElementById('ministry-students-title').textContent = ministries.students_title || 'Sunset Students';
    document.getElementById('ministry-students-content').innerHTML = (ministries.students_content || '').split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('');
    const contact = document.getElementById('ministry-contact');
    if (contact) {
      contact.querySelector('h3').textContent = ministries.contact_name || '';
      contact.querySelector('[data-contact-note]').textContent = ministries.contact_note || '';
      const phone = homepage?.phone || '940-600-8164';
      const email = homepage?.email || 'thefbcsunsettx@gmail.com';
      contact.querySelector('[data-contact-links]').innerHTML = `<a href="tel:${phone.replace(/\D/g, '')}">${esc(phone)}</a> · <a href="mailto:${email}">${esc(email)}</a>`;
    }
  } catch (e) {
    console.warn('Ministries page load failed', e);
  }
}

async function renderGivingPage() {
  const btn = document.querySelector('[data-giving-link]');
  if (!btn) return;
  try {
    const { homepage } = await fetchPublic('/homepage');
    if (homepage.giving_url) {
      btn.href = homepage.giving_url;
      btn.textContent = 'Give Online';
      btn.parentElement.querySelector('.giving-note')?.classList.add('hidden');
    }
  } catch { /* keep placeholder */ }
}

async function renderBlogIndex() {
  const container = document.getElementById('blog-list');
  if (!container) return;
  try {
    const { announcements } = await fetchPublic('/announcements');
    if (announcements.length === 0) {
      container.innerHTML = '<p class="empty-state">No blog posts yet. Check back soon!</p>';
      return;
    }
    container.innerHTML = announcements.map((post) => `
      <article class="card">
        <p class="card-meta">${formatDate(post.published_at?.slice(0, 10) || post.created_at?.slice(0, 10))} · ${esc(post.author)}</p>
        <h3>${esc(post.title)}</h3>
        <p>${esc(post.excerpt)}</p>
        <a class="card-link" href="${getPostUrl(post.slug)}">Read more →</a>
      </article>`).join('');
  } catch {
    container.innerHTML = '<p class="empty-state">Unable to load blog posts.</p>';
  }
}

async function renderBlogPost() {
  const container = document.getElementById('post-content');
  if (!container) return;
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) {
    container.innerHTML = '<p class="empty-state">Post not found. <a href="index.html">Back to blog</a></p>';
    return;
  }
  try {
    const { announcement: post } = await fetchPublic(`/announcements/slug/${encodeURIComponent(slug)}`);
    document.title = `${post.title} — FBC Sunset Blog`;
    container.innerHTML = `
      <header class="post-header">
        <h1>${esc(post.title)}</h1>
        <p class="post-meta">${formatDate(post.published_at?.slice(0, 10) || post.created_at?.slice(0, 10))} · ${esc(post.author)}</p>
      </header>
      <div class="blog-content">${typeof marked !== 'undefined' ? marked.parse(post.content) : esc(post.content)}</div>
      <p style="margin-top:2rem;"><a href="index.html">← Back to blog</a></p>`;
  } catch {
    container.innerHTML = '<p class="empty-state">Post not found. <a href="index.html">Back to blog</a></p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSiteSettings();
  renderHomepage();
  renderEventsPage();
  renderStaffPage();
  renderSermonsPage();
  renderMinistriesPage();
  renderGivingPage();
  renderBlogIndex();
  renderBlogPost();
});

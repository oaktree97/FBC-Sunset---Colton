const API = '/api';
let currentUser = null;
let currentView = 'dashboard';

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:999;max-width:320px;';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

async function init() {
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('sidebar-nav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (btn) navigate(btn.dataset.view);
  });

  try {
    const { user } = await api('/auth/me');
    currentUser = user;
    showApp();
  } catch {
    showLogin();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  try {
    const fd = new FormData(e.target);
    const { user } = await api('/auth/login', {
      method: 'POST',
      body: { email: fd.get('email'), password: fd.get('password') },
    });
    currentUser = user;
    showApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
}

async function handleLogout() {
  await api('/auth/logout', { method: 'POST' });
  currentUser = null;
  showLogin();
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('user-name').textContent = currentUser.name;
  document.getElementById('user-role').textContent = currentUser.role;
  document.querySelectorAll('.admin-only').forEach((el) => {
    el.classList.toggle('hidden', currentUser.role !== 'admin');
  });
  navigate('dashboard');
}

function navigate(view) {
  currentView = view;
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  const renderers = {
    dashboard: renderDashboard,
    homepage: renderHomepage,
    events: renderEvents,
    announcements: renderAnnouncements,
    sermons: renderSermons,
    staff: renderStaff,
    'service-times': renderServiceTimes,
    photos: renderPhotos,
    users: renderUsers,
  };
  renderers[view]?.();
}

async function renderDashboard() {
  const main = document.getElementById('main-content');
  main.innerHTML = '<p class="empty-state">Loading...</p>';
  const [events, announcements, staff, sermons, photos] = await Promise.all([
    api('/events/all'),
    api('/announcements/all'),
    api('/staff'),
    api('/sermons'),
    api('/photos'),
  ]);
  main.innerHTML = `
    <div class="page-header">
      <h1>Dashboard</h1>
      <p>Welcome back, ${esc(currentUser.name)}. Manage your church website content here.</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="number">${events.events.length}</div><div class="label">Events</div></div>
      <div class="stat-card"><div class="number">${announcements.announcements.filter(a => a.published).length}</div><div class="label">Published Posts</div></div>
      <div class="stat-card"><div class="number">${staff.staff.length}</div><div class="label">Staff</div></div>
      <div class="stat-card"><div class="number">${sermons.sermons.length}</div><div class="label">Sermons</div></div>
      <div class="stat-card"><div class="number">${photos.photos.length}</div><div class="label">Photos</div></div>
    </div>
    <div class="panel">
      <h3>Quick Links</h3>
      <p style="color:var(--admin-muted);margin-bottom:1rem;">Use the sidebar to edit homepage content, add events, publish announcements, and more.</p>
      <a href="/" target="_blank" class="btn btn-secondary">View Public Site</a>
    </div>`;
}

async function renderHomepage() {
  const main = document.getElementById('main-content');
  main.innerHTML = '<p class="empty-state">Loading...</p>';
  const { homepage, featured_photo } = await api('/homepage');
  const { photos } = await api('/photos');
  const photoOptions = photos.map((p) =>
    `<option value="${p.id}" ${homepage.featured_photo_id == p.id ? 'selected' : ''}>${esc(p.original_name || p.filename)}</option>`
  ).join('');

  main.innerHTML = `
    <div class="page-header"><h1>Homepage</h1><p>Update welcome message, contact info, and ministry cards.</p></div>
    <form id="homepage-form">
      <div class="panel">
        <h3>Hero Section</h3>
        <div class="form-group"><label>Main Title</label><input name="hero_title" value="${esc(homepage.hero_title)}"></div>
        <div class="form-group"><label>Subtitle</label><input name="hero_subtitle" value="${esc(homepage.hero_subtitle)}"></div>
        <div class="form-group"><label>Site Tagline (header)</label><input name="tagline" value="${esc(homepage.tagline)}"></div>
      </div>
      <div class="panel">
        <h3>Find Us Section</h3>
        <div class="form-group"><label>Section Title</label><input name="find_us_title" value="${esc(homepage.find_us_title)}"></div>
        <div class="form-group"><label>Description</label><textarea name="find_us_text">${esc(homepage.find_us_text)}</textarea></div>
        <div class="form-group"><label>Featured Building Photo</label>
          <select name="featured_photo_id"><option value="">— None —</option>${photoOptions}</select>
          <p class="form-hint">Upload photos in the Photos section first.</p>
        </div>
      </div>
      <div class="panel">
        <h3>Family Ministries Cards</h3>
        <div class="form-group"><label>Section Title</label><input name="ministries_title" value="${esc(homepage.ministries_title)}"></div>
        <div class="form-group"><label>Section Intro</label><textarea name="ministries_intro">${esc(homepage.ministries_intro)}</textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Kids Card Title</label><input name="kids_title" value="${esc(homepage.kids_title)}"></div>
          <div class="form-group"><label>Students Card Title</label><input name="students_title" value="${esc(homepage.students_title)}"></div>
        </div>
        <div class="form-group"><label>Kids Card Text</label><textarea name="kids_text">${esc(homepage.kids_text)}</textarea></div>
        <div class="form-group"><label>Students Card Text</label><textarea name="students_text">${esc(homepage.students_text)}</textarea></div>
      </div>
      <div class="panel">
        <h3>Contact & Giving</h3>
        <div class="form-group"><label>Address</label><input name="address" value="${esc(homepage.address)}"></div>
        <div class="form-row">
          <div class="form-group"><label>Phone</label><input name="phone" value="${esc(homepage.phone)}"></div>
          <div class="form-group"><label>Email</label><input name="email" value="${esc(homepage.email)}"></div>
        </div>
        <div class="form-group"><label>Online Giving URL</label><input name="giving_url" value="${esc(homepage.giving_url)}" placeholder="https://"></div>
      </div>
        <button type="submit" class="btn btn-primary">Save Homepage</button>
      </form>
      <form id="ministries-form" style="margin-top:2rem;">
        <div class="panel">
          <h3>Family Ministries Page</h3>
          <p class="form-hint" style="margin-bottom:1rem;">Content for the full Family Ministries page.</p>
          <div class="form-group"><label>Kids Section Title</label><input name="kids_title" id="mp-kids-title"></div>
          <div class="form-group"><label>Kids Section Content</label><textarea name="kids_content" id="mp-kids-content" rows="5"></textarea></div>
          <div class="form-group"><label>Students Section Title</label><input name="students_title" id="mp-students-title"></div>
          <div class="form-group"><label>Students Section Content</label><textarea name="students_content" id="mp-students-content" rows="5"></textarea></div>
          <div class="form-row">
            <div class="form-group"><label>Contact Name</label><input name="contact_name" id="mp-contact-name"></div>
            <div class="form-group"><label>Contact Title</label><input name="contact_note" id="mp-contact-note"></div>
          </div>
          <button type="submit" class="btn btn-primary">Save Ministries Page</button>
        </div>
      </form>`;

  const { ministries } = await api('/homepage/ministries');
  document.getElementById('mp-kids-title').value = ministries.kids_title || '';
  document.getElementById('mp-kids-content').value = ministries.kids_content || '';
  document.getElementById('mp-students-title').value = ministries.students_title || '';
  document.getElementById('mp-students-content').value = ministries.students_content || '';
  document.getElementById('mp-contact-name').value = ministries.contact_name || '';
  document.getElementById('mp-contact-note').value = ministries.contact_note || '';

  document.getElementById('ministries-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/homepage/ministries', { method: 'PUT', body: Object.fromEntries(fd) });
      toast('Ministries page saved!');
    } catch (err) { toast(err.message, 'error'); }
  });

  document.getElementById('homepage-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd);
    body.featured_photo_id = body.featured_photo_id || null;
    try {
      await api('/homepage', { method: 'PUT', body });
      toast('Homepage saved!');
    } catch (err) { toast(err.message, 'error'); }
  });
}

async function renderEvents() {
  const main = document.getElementById('main-content');
  main.innerHTML = '<p class="empty-state">Loading...</p>';
  const { events } = await api('/events/all');
  const list = events.length ? events.map((ev) => `
    <li data-id="${ev.id}">
      <div class="item-info">
        <h4>${esc(ev.title)}</h4>
        <p>${esc(ev.event_date)} · ${esc(ev.event_time)} · ${esc(ev.location)}</p>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-sm edit-btn">Edit</button>
        <button class="btn btn-danger btn-sm delete-btn">Delete</button>
      </div>
    </li>`).join('') : '<li class="empty-state">No events yet.</li>';

  main.innerHTML = `
    <div class="page-header"><h1>Events</h1><p>Create, edit, and delete upcoming church events.</p></div>
    <div class="panel">
      <h3 id="event-form-title">Add Event</h3>
      <form id="event-form">
        <input type="hidden" name="id" value="">
        <div class="form-group"><label>Title</label><input name="title" required></div>
        <div class="form-row">
          <div class="form-group"><label>Date</label><input type="date" name="event_date" required></div>
          <div class="form-group"><label>Time</label><input name="event_time" placeholder="10:30 AM"></div>
        </div>
        <div class="form-group"><label>Location</label><input name="location"></div>
        <div class="form-group"><label>Description</label><textarea name="description"></textarea></div>
        <div class="panel-actions">
          <button type="submit" class="btn btn-primary">Save Event</button>
          <button type="button" class="btn btn-secondary hidden" id="cancel-event">Cancel</button>
        </div>
      </form>
    </div>
    <div class="panel"><h3>All Events</h3><ul class="item-list" id="events-list">${list}</ul></div>`;

  const form = document.getElementById('event-form');
  const cancelBtn = document.getElementById('cancel-event');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const id = fd.get('id');
    const body = Object.fromEntries(fd);
    delete body.id;
    try {
      if (id) await api(`/events/${id}`, { method: 'PUT', body });
      else await api('/events', { method: 'POST', body });
      toast('Event saved!');
      renderEvents();
    } catch (err) { toast(err.message, 'error'); }
  });

  cancelBtn.addEventListener('click', () => {
    form.reset();
    form.querySelector('[name=id]').value = '';
    document.getElementById('event-form-title').textContent = 'Add Event';
    cancelBtn.classList.add('hidden');
  });

  document.getElementById('events-list').addEventListener('click', async (e) => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const id = li.dataset.id;
    const ev = events.find((x) => x.id == id);
    if (e.target.classList.contains('edit-btn')) {
      form.querySelector('[name=id]').value = id;
      form.querySelector('[name=title]').value = ev.title;
      form.querySelector('[name=event_date]').value = ev.event_date;
      form.querySelector('[name=event_time]').value = ev.event_time;
      form.querySelector('[name=location]').value = ev.location;
      form.querySelector('[name=description]').value = ev.description;
      document.getElementById('event-form-title').textContent = 'Edit Event';
      cancelBtn.classList.remove('hidden');
      form.scrollIntoView({ behavior: 'smooth' });
    }
    if (e.target.classList.contains('delete-btn')) {
      if (!confirm('Delete this event?')) return;
      try {
        await api(`/events/${id}`, { method: 'DELETE' });
        toast('Event deleted.');
        renderEvents();
      } catch (err) { toast(err.message, 'error'); }
    }
  });
}

async function renderAnnouncements() {
  const main = document.getElementById('main-content');
  main.innerHTML = '<p class="empty-state">Loading...</p>';
  const { announcements } = await api('/announcements/all');
  const list = announcements.map((a) => `
    <li data-id="${a.id}">
      <div class="item-info">
        <h4>${esc(a.title)} ${a.published ? '' : '(Draft)'}</h4>
        <p>${esc(a.published_at || a.created_at?.slice(0,10) || '')} · ${esc(a.author)}</p>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-sm edit-btn">Edit</button>
        <button class="btn btn-danger btn-sm delete-btn">Delete</button>
      </div>
    </li>`).join('') || '<li class="empty-state">No announcements yet.</li>';

  main.innerHTML = `
    <div class="page-header"><h1>Announcements</h1><p>Publish news and blog posts for your congregation.</p></div>
    <div class="panel">
      <h3 id="ann-form-title">New Announcement</h3>
      <form id="ann-form">
        <input type="hidden" name="id" value="">
        <div class="form-group"><label>Title</label><input name="title" required></div>
        <div class="form-group"><label>URL Slug</label><input name="slug" placeholder="auto-generated-from-title"><p class="form-hint">Used in the blog URL, e.g. summer-picnic</p></div>
        <div class="form-group"><label>Excerpt</label><textarea name="excerpt" rows="2"></textarea></div>
        <div class="form-group"><label>Content (Markdown supported)</label><textarea name="content" rows="8"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Author</label><input name="author" value="FBC Sunset"></div>
          <div class="form-group"><label class="checkbox-label" style="margin-top:1.75rem;"><input type="checkbox" name="published" value="1"> Publish immediately</label></div>
        </div>
        <div class="panel-actions">
          <button type="submit" class="btn btn-primary">Save</button>
          <button type="button" class="btn btn-secondary hidden" id="cancel-ann">Cancel</button>
        </div>
      </form>
    </div>
    <div class="panel"><h3>All Announcements</h3><ul class="item-list" id="ann-list">${list}</ul></div>`;

  const form = document.getElementById('ann-form');
  document.getElementById('cancel-ann').addEventListener('click', () => { form.reset(); form.querySelector('[name=id]').value = ''; document.getElementById('ann-form-title').textContent = 'New Announcement'; document.getElementById('cancel-ann').classList.add('hidden'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const id = fd.get('id');
    const body = {
      title: fd.get('title'), slug: fd.get('slug'), excerpt: fd.get('excerpt'),
      content: fd.get('content'), author: fd.get('author'),
      published: fd.get('published') === '1',
    };
    try {
      if (id) await api(`/announcements/${id}`, { method: 'PUT', body });
      else await api('/announcements', { method: 'POST', body });
      toast('Announcement saved!');
      renderAnnouncements();
    } catch (err) { toast(err.message, 'error'); }
  });

  document.getElementById('ann-list').addEventListener('click', async (e) => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const a = announcements.find((x) => x.id == li.dataset.id);
    if (e.target.classList.contains('edit-btn')) {
      form.querySelector('[name=id]').value = a.id;
      form.querySelector('[name=title]').value = a.title;
      form.querySelector('[name=slug]').value = a.slug;
      form.querySelector('[name=excerpt]').value = a.excerpt;
      form.querySelector('[name=content]').value = a.content;
      form.querySelector('[name=author]').value = a.author;
      form.querySelector('[name=published]').checked = !!a.published;
      document.getElementById('ann-form-title').textContent = 'Edit Announcement';
      document.getElementById('cancel-ann').classList.remove('hidden');
    }
    if (e.target.classList.contains('delete-btn') && confirm('Delete this announcement?')) {
      await api(`/announcements/${li.dataset.id}`, { method: 'DELETE' });
      toast('Deleted.');
      renderAnnouncements();
    }
  });
}

async function renderSermons() {
  const main = document.getElementById('main-content');
  main.innerHTML = '<p class="empty-state">Loading...</p>';
  const { sermons } = await api('/sermons');
  const list = sermons.map((s) => `
    <li data-id="${s.id}">
      <div class="item-info">
        <h4>${esc(s.title || 'Untitled')}</h4>
        <p>YouTube: ${esc(s.youtube_id)} ${s.sermon_date ? '· ' + esc(s.sermon_date) : ''}</p>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-sm edit-btn">Edit</button>
        <button class="btn btn-danger btn-sm delete-btn">Delete</button>
      </div>
    </li>`).join('') || '<li class="empty-state">No sermons yet.</li>';

  main.innerHTML = `
    <div class="page-header"><h1>Sermons</h1><p>Add YouTube sermon videos and optional notes.</p></div>
    <div class="panel">
      <h3 id="sermon-form-title">Add Sermon</h3>
      <form id="sermon-form">
        <input type="hidden" name="id" value="">
        <div class="form-group"><label>Title (optional)</label><input name="title"></div>
        <div class="form-group"><label>YouTube URL or Video ID</label><input name="youtube_id" required placeholder="https://youtube.com/watch?v=..."><p class="form-hint">Paste a full YouTube link or just the video ID.</p></div>
        <div class="form-row">
          <div class="form-group"><label>Date (optional)</label><input type="date" name="sermon_date"></div>
          <div class="form-group"><label>Sort Order</label><input type="number" name="sort_order" value="0"></div>
        </div>
        <div class="form-group"><label>Sermon Notes (optional)</label><textarea name="notes" rows="4"></textarea></div>
        <div class="panel-actions">
          <button type="submit" class="btn btn-primary">Save Sermon</button>
          <button type="button" class="btn btn-secondary hidden" id="cancel-sermon">Cancel</button>
        </div>
      </form>
    </div>
    <div class="panel"><h3>All Sermons</h3><ul class="item-list" id="sermon-list">${list}</ul></div>`;

  const form = document.getElementById('sermon-form');
  document.getElementById('cancel-sermon').addEventListener('click', () => { form.reset(); form.querySelector('[name=id]').value = ''; document.getElementById('sermon-form-title').textContent = 'Add Sermon'; document.getElementById('cancel-sermon').classList.add('hidden'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const id = fd.get('id');
    const body = Object.fromEntries(fd);
    delete body.id;
    body.sort_order = Number(body.sort_order) || 0;
    try {
      if (id) await api(`/sermons/${id}`, { method: 'PUT', body });
      else await api('/sermons', { method: 'POST', body });
      toast('Sermon saved!');
      renderSermons();
    } catch (err) { toast(err.message, 'error'); }
  });

  document.getElementById('sermon-list').addEventListener('click', async (e) => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const s = sermons.find((x) => x.id == li.dataset.id);
    if (e.target.classList.contains('edit-btn')) {
      form.querySelector('[name=id]').value = s.id;
      form.querySelector('[name=title]').value = s.title;
      form.querySelector('[name=youtube_id]').value = s.youtube_id;
      form.querySelector('[name=sermon_date]').value = s.sermon_date;
      form.querySelector('[name=sort_order]').value = s.sort_order;
      form.querySelector('[name=notes]').value = s.notes;
      document.getElementById('sermon-form-title').textContent = 'Edit Sermon';
      document.getElementById('cancel-sermon').classList.remove('hidden');
    }
    if (e.target.classList.contains('delete-btn') && confirm('Delete this sermon?')) {
      await api(`/sermons/${li.dataset.id}`, { method: 'DELETE' });
      toast('Deleted.');
      renderSermons();
    }
  });
}

async function renderStaff() {
  const main = document.getElementById('main-content');
  main.innerHTML = '<p class="empty-state">Loading...</p>';
  const { staff } = await api('/staff');
  const { photos } = await api('/photos');
  const photoOpts = photos.map((p) => `<option value="${p.id}">${esc(p.original_name || p.filename)}</option>`).join('');
  const list = staff.map((s) => `
    <li data-id="${s.id}">
      <div class="item-info">
        <h4>${esc(s.name)} ${s.is_featured ? '(Featured)' : ''} ${s.is_elder ? '(Elder)' : ''}</h4>
        <p>${esc(s.role)}</p>
      </div>
      <div class="item-actions">
        <button class="btn btn-secondary btn-sm edit-btn">Edit</button>
        <button class="btn btn-danger btn-sm delete-btn">Delete</button>
      </div>
    </li>`).join('');

  main.innerHTML = `
    <div class="page-header"><h1>Staff</h1><p>Manage church staff and leadership information.</p></div>
    <div class="panel">
      <h3 id="staff-form-title">Add Staff Member</h3>
      <form id="staff-form">
        <input type="hidden" name="id" value="">
        <div class="form-group"><label>Name</label><input name="name" required></div>
        <div class="form-group"><label>Role / Title</label><input name="role"></div>
        <div class="form-group"><label>Bio</label><textarea name="bio" rows="4"></textarea></div>
        <div class="form-group"><label>Photo</label><select name="photo_id"><option value="">— None —</option>${photoOpts}</select></div>
        <div class="form-row">
          <label class="checkbox-label"><input type="checkbox" name="is_featured" value="1"> Featured pastor bio</label>
          <label class="checkbox-label"><input type="checkbox" name="is_elder" value="1"> Elder</label>
        </div>
        <div class="form-group"><label>Sort Order</label><input type="number" name="sort_order" value="0"></div>
        <div class="panel-actions">
          <button type="submit" class="btn btn-primary">Save</button>
          <button type="button" class="btn btn-secondary hidden" id="cancel-staff">Cancel</button>
        </div>
      </form>
    </div>
    <div class="panel"><h3>All Staff</h3><ul class="item-list" id="staff-list">${list}</ul></div>`;

  const form = document.getElementById('staff-form');
  document.getElementById('cancel-staff').addEventListener('click', () => { form.reset(); form.querySelector('[name=id]').value = ''; document.getElementById('staff-form-title').textContent = 'Add Staff Member'; document.getElementById('cancel-staff').classList.add('hidden'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const id = fd.get('id');
    const body = {
      name: fd.get('name'), role: fd.get('role'), bio: fd.get('bio'),
      photo_id: fd.get('photo_id') || null,
      is_featured: fd.get('is_featured') === '1',
      is_elder: fd.get('is_elder') === '1',
      sort_order: Number(fd.get('sort_order')) || 0,
    };
    try {
      if (id) await api(`/staff/${id}`, { method: 'PUT', body });
      else await api('/staff', { method: 'POST', body });
      toast('Staff saved!');
      renderStaff();
    } catch (err) { toast(err.message, 'error'); }
  });

  document.getElementById('staff-list').addEventListener('click', async (e) => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const s = staff.find((x) => x.id == li.dataset.id);
    if (e.target.classList.contains('edit-btn')) {
      form.querySelector('[name=id]').value = s.id;
      form.querySelector('[name=name]').value = s.name;
      form.querySelector('[name=role]').value = s.role;
      form.querySelector('[name=bio]').value = s.bio;
      form.querySelector('[name=photo_id]').value = s.photo_id || '';
      form.querySelector('[name=is_featured]').checked = !!s.is_featured;
      form.querySelector('[name=is_elder]').checked = !!s.is_elder;
      form.querySelector('[name=sort_order]').value = s.sort_order;
      document.getElementById('staff-form-title').textContent = 'Edit Staff Member';
      document.getElementById('cancel-staff').classList.remove('hidden');
    }
    if (e.target.classList.contains('delete-btn') && confirm('Delete this staff member?')) {
      await api(`/staff/${li.dataset.id}`, { method: 'DELETE' });
      toast('Deleted.');
      renderStaff();
    }
  });
}

async function renderServiceTimes() {
  const main = document.getElementById('main-content');
  main.innerHTML = '<p class="empty-state">Loading...</p>';
  const { service_times } = await api('/service-times');
  const rows = service_times.map((t, i) => `
    <div class="service-time-row" data-i="${i}">
      <div class="form-group" style="margin:0"><label>Label</label><input class="st-label" value="${esc(t.label)}"></div>
      <div class="form-group" style="margin:0"><label>Time</label><input class="st-time" value="${esc(t.time)}"></div>
      <button type="button" class="btn btn-danger btn-sm remove-st">Remove</button>
    </div>`).join('');

  main.innerHTML = `
    <div class="page-header"><h1>Service Times</h1><p>Update the worship schedule shown across the site.</p></div>
    <div class="panel">
      <div id="st-rows">${rows}</div>
      <div class="panel-actions">
        <button type="button" class="btn btn-secondary" id="add-st">+ Add Time</button>
        <button type="button" class="btn btn-primary" id="save-st">Save Service Times</button>
      </div>
    </div>`;

  document.getElementById('add-st').addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = 'service-time-row';
    div.innerHTML = `<div class="form-group" style="margin:0"><label>Label</label><input class="st-label" value=""></div><div class="form-group" style="margin:0"><label>Time</label><input class="st-time" value=""></div><button type="button" class="btn btn-danger btn-sm remove-st">Remove</button>`;
    document.getElementById('st-rows').appendChild(div);
  });

  document.getElementById('st-rows').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-st')) e.target.closest('.service-time-row').remove();
  });

  document.getElementById('save-st').addEventListener('click', async () => {
    const rows = [...document.querySelectorAll('.service-time-row')];
    const service_times = rows.map((row, i) => ({
      label: row.querySelector('.st-label').value,
      time: row.querySelector('.st-time').value,
      sort_order: i,
    })).filter((t) => t.label && t.time);
    try {
      await api('/service-times', { method: 'PUT', body: { service_times } });
      toast('Service times saved!');
    } catch (err) { toast(err.message, 'error'); }
  });
}

async function renderPhotos() {
  const main = document.getElementById('main-content');
  main.innerHTML = '<p class="empty-state">Loading...</p>';
  const { photos } = await api('/photos');
  const grid = photos.map((p) => `
    <div class="photo-card" data-id="${p.id}">
      <img src="/uploads/${esc(p.filename)}" alt="${esc(p.alt_text)}">
      <div class="photo-card-info"><p>${esc(p.original_name || p.filename)}</p><p>${esc(p.category)}</p></div>
      <div class="photo-card-actions">
        <button class="btn btn-secondary btn-sm edit-photo">Edit</button>
        ${currentUser.role === 'admin' ? '<button class="btn btn-danger btn-sm delete-photo">Delete</button>' : ''}
      </div>
    </div>`).join('') || '<p class="empty-state">No photos uploaded yet.</p>';

  main.innerHTML = `
    <div class="page-header"><h1>Photos</h1><p>Upload and manage images used across the website.</p></div>
    <div class="panel">
      <label class="upload-zone" id="upload-zone">
        <input type="file" id="photo-file" accept="image/*">
        <p><strong>Click to upload</strong> or drag a photo here</p>
        <p class="form-hint">JPG, PNG, GIF, WebP — max 10 MB</p>
      </label>
      <div class="form-row">
        <div class="form-group"><label>Alt Text</label><input id="photo-alt" placeholder="Describe the image"></div>
        <div class="form-group"><label>Category</label><select id="photo-cat"><option value="general">General</option><option value="building">Building</option><option value="staff">Staff</option><option value="ministry">Ministry</option><option value="events">Events</option></select></div>
      </div>
    </div>
    <div class="panel"><h3>Photo Library</h3><div class="photo-grid" id="photo-grid">${grid}</div></div>`;

  document.getElementById('photo-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    fd.append('alt_text', document.getElementById('photo-alt').value);
    fd.append('category', document.getElementById('photo-cat').value);
    try {
      await api('/photos', { method: 'POST', body: fd });
      toast('Photo uploaded!');
      renderPhotos();
    } catch (err) { toast(err.message, 'error'); }
  });

  document.getElementById('photo-grid').addEventListener('click', async (e) => {
    const card = e.target.closest('.photo-card');
    if (!card) return;
    const id = card.dataset.id;
    const p = photos.find((x) => x.id == id);
    if (e.target.classList.contains('edit-photo')) {
      const alt = prompt('Alt text:', p.alt_text);
      if (alt === null) return;
      const cat = prompt('Category (general, building, staff, ministry, events):', p.category);
      if (cat === null) return;
      await api(`/photos/${id}`, { method: 'PUT', body: { alt_text: alt, category: cat } });
      toast('Photo updated.');
      renderPhotos();
    }
    if (e.target.classList.contains('delete-photo') && confirm('Delete this photo permanently?')) {
      await api(`/photos/${id}`, { method: 'DELETE' });
      toast('Photo deleted.');
      renderPhotos();
    }
  });
}

async function renderUsers() {
  if (currentUser.role !== 'admin') return;
  const main = document.getElementById('main-content');
  main.innerHTML = '<p class="empty-state">Loading...</p>';
  const { users } = await api('/auth/users');
  const list = users.map((u) => `
    <li data-id="${u.id}">
      <div class="item-info"><h4>${esc(u.name)}</h4><p>${esc(u.email)} · ${esc(u.role)}</p></div>
      <div class="item-actions">${u.id !== currentUser.id ? '<button class="btn btn-danger btn-sm delete-user">Delete</button>' : ''}</div>
    </li>`).join('');

  main.innerHTML = `
    <div class="page-header"><h1>Users</h1><p>Manage admin and editor accounts. Admin only.</p></div>
    <div class="panel">
      <h3>Add User</h3>
      <form id="user-form">
        <div class="form-row">
          <div class="form-group"><label>Name</label><input name="name" required></div>
          <div class="form-group"><label>Email</label><input type="email" name="email" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Password</label><input type="password" name="password" required minlength="8"></div>
          <div class="form-group"><label>Role</label><select name="role"><option value="editor">Editor</option><option value="admin">Admin</option></select></div>
        </div>
        <button type="submit" class="btn btn-primary">Create User</button>
      </form>
    </div>
    <div class="panel"><h3>All Users</h3><ul class="item-list" id="user-list">${list}</ul></div>`;

  document.getElementById('user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/auth/users', { method: 'POST', body: Object.fromEntries(fd) });
      toast('User created!');
      renderUsers();
      e.target.reset();
    } catch (err) { toast(err.message, 'error'); }
  });

  document.getElementById('user-list').addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-user') && confirm('Delete this user?')) {
      await api(`/auth/users/${e.target.closest('li').dataset.id}`, { method: 'DELETE' });
      toast('User deleted.');
      renderUsers();
    }
  });
}

init();

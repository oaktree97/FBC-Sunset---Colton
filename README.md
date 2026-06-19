# FBC Sunset Church Website

First Baptist Church Sunset website with a secure admin portal and SQLite database.

## Quick Start

```bash
npm install
cp .env.example .env    # Edit JWT_SECRET and admin password
npm run seed
npm start
```

- **Public site:** http://localhost:3000
- **Admin portal:** http://localhost:3000/admin

Default admin login (change after first sign-in):
- Email: `admin@fbcsunset.org` (or value from `.env`)
- Password: `ChangeMe123!` (or value from `.env`)

## Admin Portal

Staff sign in at `/admin` to manage all website content without editing code.

### Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access: all content, user management, photo deletion |
| **Editor** | Create and edit events, announcements, sermons, staff, homepage, service times, and upload photos |

### What You Can Manage

- **Homepage**: Hero text, Find Us section, ministry cards, contact info, giving URL
- **Events**: Create, edit, and delete upcoming events
- **Announcements**: Publish blog posts and church news (Markdown supported)
- **Sermons**: Add YouTube videos and sermon notes
- **Staff**: Update team members, bios, and featured pastor
- **Service Times**: Edit the worship schedule
- **Photos**: Upload and organize images for use across the site
- **Users** *(Admin only)*: Invite other staff as Admin or Editor

## How It Works

- **Express.js** server serves the public HTML site and REST API
- **SQLite** database stores all editable content (`data/fbc.db`)
- **JWT + HTTP-only cookies** secure admin sessions
- **bcrypt** hashes all passwords
- Uploaded photos are stored in `uploads/`

The public pages fetch content from `/api/*` endpoints at load time, so changes in the admin portal appear immediately after saving.

## Production Deployment

This site requires a Node.js host (not static-only hosting like Netlify without functions). Good options:

- [Railway](https://railway.app)
- [Render](https://render.com)
- [Fly.io](https://fly.io)
- A church VPS or shared Node host

Before going live:

1. Set a strong `JWT_SECRET` in `.env`
2. Change the default admin password
3. Set `NODE_ENV=production`
4. Use HTTPS (most hosts provide this automatically)

## Project Structure

```
├── admin/           Admin dashboard (login + content manager)
├── server/          Express API, database, auth
├── data/            SQLite database (created on first run)
├── uploads/         Uploaded photos
├── js/content.js    Loads dynamic content on public pages
├── index.html       Public pages
└── package.json
```

## Legacy Files

`blog/posts.json` and `data/events.json` were used by the previous static CMS setup. The live site now reads from the database. These files can be ignored.

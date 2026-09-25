# Chinthaka Withanage — CV Site & Back Office

A personal CV / portfolio site with a MySQL-backed back office for managing
career achievements, projects, experience, skills, education, certifications
and referees. Built with Express + EJS, deployable to Vercel's free tier.

## Stack

- **Node.js / Express** — server, mounted as a single Vercel serverless function (`api/index.js`)
- **EJS templates** — located in `templates/` (public site + admin views)
- **MySQL** (`mysql2`) — data storage; works with any MySQL-compatible free host (PlanetScale, Railway, Aiven, Clever Cloud)
- **JWT (httpOnly cookie)** — stateless admin authentication (no session store needed, ideal for serverless)
- Plain CSS in `public/css/style.css` — custom navy / teal / amber theme

## Project structure

```
api/index.js         Vercel serverless entry point
app.js                Express app (routes, middleware, security headers)
server.js             Local dev entry point (npm run dev / npm start)
config/db.js          MySQL connection pool
config/sections.js    Declarative config for every back-office CRUD section
controllers/          Route handlers (public site, auth, admin, generic CRUD)
middleware/           auth.js (JWT check), csrf.js (form token check)
models/genericModel.js  Parameterized CRUD helper shared by all sections
routes/                public.js, admin.js, auth.js
templates/             EJS views — public site + templates/admin/*
public/                Static CSS/JS served at /public
db/schema.sql          Table definitions
db/seed.sql            Initial data pulled from the CV
scripts/initDb.js      Runs schema + seed against your DB (npm run db:init)
```

## Local setup

1. Copy `.env.example` to `.env` and fill in your MySQL credentials.
2. Generate your own admin credentials (do not use the sample hash in production):
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('your-strong-password', 10))"
   ```
   Put the output in `ADMIN_PASSWORD_HASH`, and set `ADMIN_USERNAME` and a random `JWT_SECRET`
   (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
3. Install dependencies and initialize the database:
   ```bash
   npm install
   npm run db:init   # creates tables and seeds CV data if empty
   ```
4. Run the app:
   ```bash
   npm run dev        # nodemon, http://localhost:3000
   ```
5. Visit `/` for the public CV, and `/admin/login` for the back office.

## Deploying to Vercel (free tier)

1. Provision a free MySQL database (e.g. [PlanetScale](https://planetscale.com),
   Railway, or Aiven). Note the host, user, password, database name, and whether
   SSL is required (set `DB_SSL=true` if so).
2. Push this repo to GitHub, then import it into Vercel.
3. In the Vercel project's **Environment Variables**, add everything from
   `.env.example` with your real values (`DB_HOST`, `DB_PORT`, `DB_USER`,
   `DB_PASSWORD`, `DB_NAME`, `DB_SSL`, `JWT_SECRET`, `ADMIN_USERNAME`,
   `ADMIN_PASSWORD_HASH`, `NODE_ENV=production`).
4. Run `npm run db:init` once locally (or via a one-off script) pointed at the
   production database to create tables and seed the initial CV content.
5. Deploy. `vercel.json` routes all requests to `api/index.js` (the Express app)
   and serves `/public/**` as static files.

## Back office

- Log in at `/admin/login`. On first `npm run db:init`, an `admins` row is bootstrapped
  from `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` in your environment — those env vars are
  only used once, for that initial bootstrap.
- Change the password any time from **Change Password** in the sidebar (`/admin/password`);
  this updates the `admins` table directly, so it works the same locally and on Vercel.
- The dashboard links to CRUD screens for Achievements, Experience, Projects,
  Skills, Education, Certifications and Referees, plus a Profile editor for the
  hero/contact details.
- Use **Achievements** to log new milestones (awards, certifications, promotions)
  as they happen — they appear instantly on the public site's Achievements section.
- A light/dark theme toggle is available in the site nav and the admin sidebar; the
  choice is remembered per-browser via `localStorage`.

## Security notes

- Passwords are never stored in plaintext — only a bcrypt hash in the environment.
- Admin auth uses a signed, httpOnly, `SameSite=Lax` JWT cookie (`secure` in production).
- All state-changing admin requests require a per-session CSRF token embedded as a hidden form field.
- All SQL is parameterized via `mysql2` placeholders — no string-built queries with user input.
- `helmet` sets a restrictive Content-Security-Policy and other security headers.
- Login attempts are rate-limited (10 per 15 minutes per IP).

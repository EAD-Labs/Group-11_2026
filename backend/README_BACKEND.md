# Kanini Padhai — Backend API

Node.js + Express + PostgreSQL API for teacher login, student profiles, and
per-student progress tracking on the Kanini Padhai learning trail.

This backend serves **only the Learning Trail** half of Kanini Padhai (auth,
students, progress). The Analytics dashboard does not call this API at all —
its numbers are static data baked into the frontend bundle at build time. See
the main repo README for the full picture of how the two halves fit together.

---

## Table of contents

1. [What this covers (v1)](#what-this-covers-v1)
2. [What this does NOT cover yet](#what-this-does-not-cover-yet)
3. [Repository layout](#repository-layout)
4. [Database schema](#database-schema)
5. [Auth flow, in detail](#auth-flow-in-detail)
6. [API reference](#api-reference)
7. [Error shape & conventions](#error-shape--conventions)
8. [CORS](#cors)
9. [Local setup](#local-setup)
10. [Environment variables](#environment-variables)
11. [Deploying](#deploying)
12. [Frontend integration notes](#frontend-integration-notes)
13. [Known issues / things to check](#known-issues--things-to-check)

---

## What this covers (v1)

- Teacher signup / login (email + password, bcrypt-hashed)
- JWT access tokens (15 min) + rotating refresh tokens in an httpOnly cookie
- Student profiles under a teacher (name, class 1–8)
- Progress tracking per student per resource (mark/unmark complete)
- Login rate limiting and generic (non-leaking) auth error responses

## What this does NOT cover yet

- Student self-login (a `pin_hash` column exists in the `students` table, reserved for this, but nothing reads or writes it yet)
- Assessment portal integration (kept as an outbound link to `kanini.ashanet.org`, per project decision — not proxied or integrated here)
- Other subjects besides Maths (the schema already supports more via the `subject` column on `progress` — no migration needed to add more later)
- Docker packaging (not included yet)
- Analytics data of any kind — that dashboard reads a static JSON blob compiled into the frontend, not this API

---

## Repository layout

```
backend/
├─ src/
│  ├─ index.js              # Express app entry — CORS, middleware, route mounting
│  ├─ db/
│  │  └─ pool.js             # Postgres connection pool
│  ├─ middleware/
│  │  └─ auth.js             # JWT verify/sign, Bearer-token guard
│  └─ routes/
│     ├─ auth.js             # register / login / refresh / logout
│     ├─ students.js         # CRUD for student profiles
│     └─ progress.js         # mark / unmark a resource complete
├─ migrations/
│  └─ 001_init.sql           # teachers, students, progress, refresh_tokens
├─ scripts/
│  └─ migrate.js             # runs the SQL migration(s) against DATABASE_URL
├─ .env.example
└─ README.md                 # this file
```

---

## Database schema

Four tables, created by `migrations/001_init.sql`:

### `teachers`
The only login-capable account type — students don't log in themselves in v1.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `name` | text | |
| `email` | text | unique |
| `password_hash` | text | bcrypt |
| `school_name` | text | optional |
| `created_at` | timestamp | |

### `students`
A roster entry under a teacher.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `teacher_id` | uuid | FK → `teachers.id` |
| `name` | text | |
| `class_level` | int | 1–8 |
| `pin_hash` | text | **unused** — reserved for future student self-login |
| `avatar_seed` | text | drives a generated avatar on the frontend |
| `created_at` | timestamp | |

### `progress`
One row per (student, subject, resource) completion.

| Column | Type | Notes |
|---|---|---|
| `student_id` | uuid | FK → `students.id` |
| `subject` | text | e.g. `"Maths"` — schema already supports other subjects |
| `class_level` | int | |
| `term` | text | `I` / `II` / `III` |
| `topic` | text | |
| `resource_key` | text | mirrors the frontend's stable key format `${classLevel}-${term}-${topic}-${title}` |
| `completed_at` | timestamp | |

Unique constraint on `(student_id, subject, resource_key)` — marking the same resource complete twice is a no-op rather than a duplicate row.

### `refresh_tokens`
Backs the rotating-refresh-token pattern described below.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `teacher_id` | uuid | FK → `teachers.id` |
| `token_hash` | text | sha256 of the raw token — the raw value is never stored |
| `expires_at` | timestamp | 30 days from issue |
| `revoked` | boolean | set on logout or on rotation of an older token |

---

## Auth flow, in detail

- **Access token** — a JWT signed with `JWT_ACCESS_SECRET`, 15-minute expiry, payload `{ sub: teacherId }`. Sent as `Authorization: Bearer <token>` on every protected route. The frontend keeps this in React state only — deliberately never in `localStorage`, to reduce XSS exposure.
- **Refresh token** — a random 48-byte hex string generated server-side; only its SHA-256 hash is persisted in `refresh_tokens` (the raw value is never stored, only ever sent to the browser). Delivered as an `httpOnly` cookie scoped to path `/api/auth`:
  - `Secure; SameSite=None` in production — required because the Vercel frontend and Render backend are on different domains, so the refresh cookie is cross-site.
  - `SameSite=Lax` in development, where frontend and backend typically share `localhost`.
  - 30-day expiry, **rotated on every use**: `POST /api/auth/refresh` revokes the token it was given and issues a brand-new one, so a stolen refresh token has a limited window before rotation invalidates it.
- **Login rate limiting** — `express-rate-limit`, 10 attempts per 15 minutes per IP on `/api/auth/login`, to slow down credential-stuffing attempts.
- **No user-enumeration via login errors** — login responses are shaped identically whether the email exists or not. A dummy bcrypt compare runs even on a miss (so response timing doesn't leak it either), and the error message is always the generic `"Invalid email or password"`.
- **Session expiry handling (frontend contract)** — if the access token expires mid-session, the frontend is expected to silently call `/api/auth/refresh` via the cookie and retry once; only if that also fails should it drop to a login screen.

---

## API reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | – | Liveness check → `{ ok: true }` |
| POST | `/api/auth/register` | – | Create a teacher account — `name`, `email`, `password` (min 8 chars), optional `schoolName` |
| POST | `/api/auth/login` | – | Log in, returns access token + sets refresh cookie. Rate-limited. |
| POST | `/api/auth/refresh` | refresh cookie | Rotate refresh token, get a new access token |
| POST | `/api/auth/logout` | refresh cookie | Revoke the refresh token |
| GET | `/api/students` | Bearer | List this teacher's students |
| POST | `/api/students` | Bearer | Add a student — `name`, `classLevel` |
| PATCH | `/api/students/:id` | Bearer | Update a student |
| DELETE | `/api/students/:id` | Bearer | Remove a student |
| GET | `/api/students/:id/progress?subject=Maths` | Bearer | Get a student's completed resources |
| POST | `/api/students/:id/progress` | Bearer | Mark a resource complete |
| DELETE | `/api/students/:id/progress/:resourceKey` | Bearer | Un-mark a resource |

All `Bearer`-marked routes require `Authorization: Bearer <accessToken>`.

---

## Error shape & conventions

- Unmatched routes → `404 { error: "Not found" }`
- Unhandled server errors → `500 { error: "Something went wrong" }` — stack traces are logged server-side only and are never sent to the client.
- Auth errors are intentionally generic (see [Auth flow](#auth-flow-in-detail)) — don't add more specific messaging here without re-checking the enumeration risk first.

---

## CORS

`CORS_ORIGINS` (comma-separated) whitelists exact frontend origins in production.

In non-production (`NODE_ENV !== "production"`), the backend reflects back whatever `Origin` header the request sent — convenient for local dev against any port, but deliberately permissive, so this behavior must not leak into a production deploy. Always confirm `NODE_ENV=production` is actually set on the host before treating a deploy as done.

---

## Local setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_ACCESS_SECRET
npm run migrate        # creates tables
npm run dev             # starts on http://localhost:4000
```

Generate a secret for `JWT_ACCESS_SECRET`:
```bash
openssl rand -hex 32
```

Confirm it's running:
```bash
curl http://localhost:4000/api/health
# { "ok": true }
```

---

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `JWT_ACCESS_SECRET` | yes | generate with `openssl rand -hex 32`; rotate if ever exposed |
| `CORS_ORIGINS` | yes in production | comma-separated exact frontend origin(s), e.g. the Vercel domain |
| `NODE_ENV` | yes in production | must be `production` so refresh cookies get `Secure; SameSite=None` |
| `PGSSL` | usually | leave at its default (`true`) for managed Postgres providers that require SSL |

See `.env.example` for the full list with placeholder values.

---

## Deploying

This is a plain Node process + Postgres — it runs anywhere that offers both:

- **Render / Railway** — easiest for a first deploy. Add a Postgres instance,
  set the env vars from `.env.example`, set the start command to `npm start`
  and build command to `npm install && npm run migrate`. Note that on
  Render's free tier the service sleeps when idle — the first request after
  inactivity can take 30–50 seconds to respond, which the frontend should
  tolerate gracefully (e.g. a longer timeout / loading state on first login
  of the day).
- **Your own VPS / alongside kanini.ashanet.org** — if that server already
  runs Node, you can deploy this the same way, behind nginx as a reverse
  proxy on a subpath or subdomain like `api.ashanet.org`.
- **Docker** — not included yet; ask if you want a Dockerfile added.

Whichever host you pick:
- Set `CORS_ORIGINS` to the exact domain(s) the React frontend will be served from — this must match exactly (scheme + host), not a wildcard.
- Set `NODE_ENV=production` so refresh-token cookies are sent with `Secure; SameSite=None` (required for cross-site cookies over HTTPS between separate frontend/backend domains).
- On the frontend side, `VITE_API_BASE` must point at this backend's full URL with no trailing slash (the frontend does strip one defensively, but it's cleaner not to rely on that).

---

## Frontend integration notes

The React app currently keeps progress in local component state
(`useState(new Set())`). To wire it to this API:

1. On login, store the returned `accessToken` in memory (e.g. React context or
   the top-level `App.jsx` state — not `localStorage`, to limit XSS exposure)
   and keep an `apiFetch()`/axios wrapper that retries once via
   `/api/auth/refresh` on a 401 before giving up and redirecting to login.
2. Add a student picker (already scoped as a Trail app feature — see the main
   repo README's Account/Student Management page) so the app knows which
   `studentId` to save progress under, and let the teacher switch students
   mid-session without logging out.
3. Replace `toggleComplete` with a call to `POST /api/students/:id/progress`
   (or the `DELETE` variant to un-mark), and load initial state from
   `GET /api/students/:id/progress` on mount so completed state survives a
   page reload.
4. `resourceKey` should stay exactly `${classLevel}-${term}-${topic}-${title}`
   to match what the frontend already generates — this is also what the
   `progress` table's unique constraint is keyed on, so any drift here will
   either silently fail to dedupe or create orphaned rows.
5. On a failed "mark complete" call (network/API error), revert the
   optimistic UI update and surface an inline error rather than leaving the
   checkmark showing a state that isn't actually saved.

Happy to do this wiring as the next step once the backend is deployed
somewhere reachable.

---

## Known issues / things to check

- A real `backend/.env` file (not just `.env.example`) has existed in the
  working tree, and `.gitignore` has not always excluded `.env`. Before
  treating any deployed secret as safe, check the GitHub history directly
  for whether `.env` was ever committed — if it was, rotate `DATABASE_URL`
  and `JWT_ACCESS_SECRET` immediately.
- `pin_hash` on `students` is unused — don't assume student self-login works
  just because the column exists.
- There's no Dockerfile yet, so containerized deploys need one written first.

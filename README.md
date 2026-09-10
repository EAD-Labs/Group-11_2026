# Kanini Padhai

**Kanini Padhai** ("Kanini" learning) is a bilingual (Tamil/English) learning-resource hub and assessment-analytics dashboard built for **Asha for Education's** tutoring program.

The app has two independent halves that share one codebase, one build, and one visual language:

- **The Learning Trail** — a browsing tool where a teacher picks a class (1–8) and a term (I/II/III) and gets a curated list of external learning resources (videos, worksheets, games, books) per topic, in Tamil/English, sourced from Diksha, Khan Academy, Math Playground, Cool Math for Kids, Math Learning Center, Hooda Math, ICT Games, Easy Teaching, mathgames.com, and similar sites. Teachers can log in, add student profiles, and mark resources "completed" per student.
- **The Analytics Dashboard** — a six-tab dashboard summarizing assessment data (the "AAA" annual assessment) collected across Asha-supported schools: scores, oral-skill progression, and engagement with the trail itself.

These two halves are functionally independent — the Trail's content catalog has nothing to do with the assessment data behind Analytics — but they're built as two views of a single React app and deployed together.

Students never log in directly in this version. The primary users are **teachers/volunteers** (Trail) and **program coordinators/data analysts** (Analytics).

**Repo:** `github.com/Maitranya/Asha_kanini` — frontend at the repo root, backend in `backend/`.

---

## Table of contents

1. [Who it's for](#who-its-for)
2. [Core user flows](#core-user-flows)
3. [Page-by-page feature breakdown](#page-by-page-feature-breakdown)
4. [Tech stack](#tech-stack)
5. [Repository structure](#repository-structure)
6. [Frontend architecture](#frontend-architecture)
7. [Backend architecture](#backend-architecture)
8. [How the Analytics numbers are actually computed](#how-the-analytics-numbers-are-actually-computed)
9. [Design system](#design-system)
10. [Deployment](#deployment)
11. [Bug history](#bug-history--why-the-code-looks-the-way-it-does)
12. [Data checked and confirmed not usable](#data-checked-and-confirmed-not-usable)
13. [Known limitations & open questions](#known-limitations--open-questions)
14. [Glossary](#glossary)
15. [Getting started](#getting-started)

---

## Who it's for

### Primary persona — "The Volunteer Teacher"
- Works with primary/middle-school students (classes 1–8) in an Asha-supported school or tuition center, often in Tamil-medium settings.
- Has a phone or shared laptop, sometimes patchy internet — needs the app to be fast, simple, and forgiving of interruptions.
- Is not deeply technical; navigates by big, obvious buttons and recognizable icons rather than menus.

**Primary goals:**
- Quickly find the right resource for e.g. "Class 3, Term II, Geometry" without scrolling through irrelevant content.
- Track which resources a specific student has already done, so nothing is repeated or skipped.
- (If also a coordinator) Check how schools are performing on the AAA assessment — who's ahead, who's falling behind, where oral vs. written skills diverge — to decide where to focus support.

### Secondary persona — "The Program Coordinator / Data Analyst"
- Doesn't do day-to-day teaching; uses only the Analytics section.
- Wants school-level and class-level trends, rankings, and the ability to slice by year — not individual student data.

---

## Core user flows

### Flow A — Browse & mark a resource complete (primary flow)
1. Land on the Home/Trail view → see the current class + term selector.
2. Select a class (1–8) and term (I/II/III) from the selector controls.
3. View the list of topics for that class/term, each showing a resource-count badge.
4. Tap a topic → land on the Topic Detail view, showing all resources (video/worksheet/game/book/etc.) with title, description, source package, and an external link.
5. If logged in with a student selected, tap the completion toggle on a resource → it's marked done for that student and synced to the backend.
6. Tap "back" → return to the topic list; completed items now show a checkmark state.

### Flow B — Search for a resource
1. From anywhere, tap **Search** in the nav.
2. Type a keyword (e.g., "fractions").
3. See a filtered, flattened list of matching resources across all classes/terms/topics.
4. Tap a result → jumps into that resource's context (ideally deep-links back to its topic).

### Flow C — Teacher account & student management
1. Tap **Log in** → modal/page with "Log in" / "Create account" tabs.
2. Create account: name, school (optional), email, password → submit → redirected into the app, now authenticated.
3. From the Account view, tap "Add student" → enter student name + class level → student appears in a picker.
4. Select an active student from the picker (persists across the session) so all "mark complete" actions apply to that student.
5. Switch students at any time via the same picker without logging out.

### Flow D — Review assessment analytics (coordinator flow)
1. Tap **Analytics** in the nav (opens as a full-page view, same tab — a plain `<a href="/analytics">` full page load, not a client-side transition).
2. Land on the **Overview** tab → see top-line KPIs and a quick-read chart.
3. Switch to **School Averages** → pick a year from the dropdown → view the heatmap table of every school's scores.
4. Toggle between "All Schools" and "CS Results" sub-views.
5. Scroll to the Ranking section → toggle Top 10 / Bottom 10 → identify standout or struggling schools by ID.
6. Scroll to the Oral Assessment Status table → switch the subject pill (English/Maths/Tamil) to see skill-level breakdowns.
7. Switch to **Assessment Analysis** → pick a sub-view (Overall Scores / Oral Assessment / Written Assessment) → pick subject and/or class pills → read the corresponding chart.
8. Tap "← Back to Dashboard" to return to the main Trail app.

---

## Page-by-page feature breakdown

### Home / Trail Browser (`/`, default view)
**Purpose:** entry point; lets the teacher pick a class + term and see available topics at a glance.

**Key UI:** top nav bar (logo, "Trail" active state, "Search", "Analytics", "Log in"/account menu, points/progress badge like "0/958"); class selector (1–8); term selector (I/II/III, segmented control); topic list cards/rows with resource counts (e.g. "Geometry · 36 resources"); optional hero/illustration area with a roadmap-style path of topic nodes; a persistent student picker/chip once a student is selected.

**Dynamic states:** skeleton loading (data is static/bundled so this should be near-instant, but a brief loading state still matters for perceived responsiveness); empty state for a class/term with zero topics; "no student selected" state that disables/hides completion tracking with a prompt to log in and pick a student; authenticated + student-selected state showing per-topic progress (e.g. "3/9 done").

### Topic Detail View
**Purpose:** shows every individual resource within one topic so the teacher can pick what to use in a session.

**Key UI:** breadcrumb/back button; topic title + class/term context label; resource list with title, short description, type badge (Video/Worksheet/Game/Simulation/Book/Classroom Presentation/Teacher Material/Lesson Text, each ideally with a distinct icon/color), source package name (Diksha, Khan Academy, etc.), external "open" link; per-resource completion toggle (only interactive when a student is active); optional resource-type filter.

**Dynamic states:** skeleton loading rows; visually distinct completed vs. not-completed row states; disabled toggle with a hint when no student is active; inline error + optimistic-UI revert if marking complete fails; "opens in new tab" affordance so a broken external link doesn't lose the teacher's place.

### Search
**Purpose:** fast keyword lookup across the entire resource catalog, bypassing the class/term hierarchy.

**Key UI:** prominent search input; result list (same row style as Topic Detail, plus class/term/topic context since results span the whole catalog); result count indicator ("42 results for 'fractions'"); optional filters (class, resource type).

**Dynamic states:** empty-query prompt or recently-viewed/popular resources instead of a blank screen; clear "no results" message with a suggestion to broaden the term; instant client-side filtering (debounced to avoid jank on every keystroke); fuzzy-matching/typo tolerance flagged as an open design question, not yet confirmed in scope.

### Account (Login / Register / Student Management)
**Purpose:** authenticate the teacher and manage the roster of students whose progress is tracked.

**Key UI:** tabbed "Log in"/"Create account" panel; login form (email, password with show/hide, submit, error area); register form (name, school name optional, email, password); post-auth student list/picker (name, class level, avatar), "Add student" button/modal, edit/remove actions; logout action.

**Dynamic states:** disabled form + spinner while auth is in flight; generic, non-revealing error messages ("Invalid email or password", "An account with this email already exists") so login errors don't leak which field failed; empty-student-list prompt with a CTA; silent access-token refresh via the httpOnly cookie on expiry, falling back to a "please log in again" redirect if that also fails; toast/inline confirmation on success.

### Analytics — Overview Tab
**Purpose:** at-a-glance summary of the whole program's assessment footprint for a coordinator opening the dashboard for the first time.

**Key UI:** KPI card grid (schools assessed, students assessed, average score %, participation rate, years of data, schools using the app), each with icon, big number, label, sub-label; a "quick read" headline bar chart of average score by subject/class with a plain-language caption; a persistent callout noting the dashboard reads a sample export, not live production data.

**Dynamic states:** brief skeleton loading for KPI cards even though data is bundled; "—" shown instead of 0 or a broken chart when a KPI can't be computed for the current sample.

### Analytics — Performance Tab
**Purpose:** deeper score trends and comparisons (a pre-existing tab, general performance charting).

**Key UI:** chart cards with subject-colored series; comparison bars/ranked lists reusing the same visual pattern as the rest of Analytics.

**Dynamic states:** standard loading skeleton, empty-series fallback, tooltip-on-hover interaction.

### Analytics — School Averages Tab
**Purpose:** the core "which schools are doing what" reference table for coordinators.

**Key UI:** year selector dropdown; sub-view pills ("All Schools (English/Maths)" vs. "CS Results"); heatmap data table with a sticky first column (School #ID) and one column per class/subject combo (1-E, 1-M, 2-E, 2-M … 6-M), each cell showing avg score + "attempted/enrolled" fraction, color-banded by performance, horizontally scrollable on narrow viewports; a ranking section (Top 10/Bottom 10 toggle, ranked rows with rank number, School #ID, avg %, and metadata like class/subject combos counted, student-entries, RTE score, teacher count, enrollment); an RTE-correlation scatter chart (X = RTE Score, Y = avg score %, one dot per school, tooltip on hover); an Oral Assessment Status table (subject pills, Class × skill-level percentage grid).

**Dynamic states:** callout instead of a table for a year with no written data; persistent info callout explaining CS papers only exist from 2024 when the sampled score range has none; schools with fewer than 2 valid class/subject cells silently excluded from ranking rather than shown as broken rows; the scatter chart only renders when ≥5 schools have an RTE score on record for the selected year, otherwise hidden/shown as "not enough data"; sticky School column preserved during horizontal table scroll on mobile.

### Analytics — Assessment Analysis Tab
**Purpose:** trend and breakdown charts across classes for a chosen year, split into three analytical lenses.

**Key UI:** year selector (same pattern as School Averages); sub-view pills ("Overall Scores" / "Oral Assessment" / "Written Assessment"); subject pills (English/Maths/Tamil, hidden on the Written sub-view, which instead uses class + subject pills); Overall Scores view — line chart with two series (Written Score %, Oral Progress %) across classes; Oral Assessment view — multi-line chart, one line per skill-level category, showing cumulative % reaching each level by class, with a "cumulative" clarifying caption; Written Assessment view — class + subject pill rows and a bar chart of average % score per question number.

**Dynamic states:** inline callout instead of an empty chart canvas when there's no data for the selected year/subject combo; `connectNulls`-style handling for sparse series so missing points don't break a chart, while isolated single-point series stay visually distinct from a real trend; an always-visible explanatory subtitle noting the tab can't show a true side-by-side cohort comparison (a known data limitation), so it never implies a comparison that isn't actually happening.

### Analytics — What Influences Scores Tab
**Purpose:** correlation-style exploration — parental education, tuition, breakfast, homework, oral-vs-written performance, etc.

**Key UI:** multiple chart cards, each isolating one variable's relationship to score; ranked/comparison bar lists for categorical variables.

**Dynamic states:** standard loading/empty/tooltip states, consistent with the rest of Analytics.

### Analytics — Content Engagement Tab
**Purpose:** usage analytics for the Trail app itself (separate from assessment scores) — top actions, top content opened, adoption over time.

**Key UI:** ranked list of top actions/top subjects/top content opened; time-series or bar chart of schools using the app per year.

**Dynamic states:** standard loading/empty states; ranked lists handle ties or very short lists gracefully.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19, bundled with Vite 8 (`@vitejs/plugin-react`) |
| Routing | None — a manual `window.location.pathname` check in `main.jsx` decides between the Trail app and Analytics dashboard |
| State management | Local component state only (`useState`, `useMemo`) — no Redux, Zustand, or Context API; each top-level app owns its own state tree |
| Styling | Plain CSS via `<style>` blocks scoped per component, using CSS custom properties for theme tokens — no Tailwind, no CSS-in-JS, no component library; all UI primitives are hand-built |
| Charts | Recharts (`BarChart`, `LineChart`, `ScatterChart`, `Legend`, `Tooltip`, `ResponsiveContainer`) |
| Icons | lucide-react |
| Auth token storage | Access token (JWT) kept in-memory (React state) only, deliberately not `localStorage`, to reduce XSS exposure; refresh token lives in an `httpOnly` cookie, invisible to JS entirely |
| Data fetching | A single `apiFetch()` wrapper around `fetch()` — no axios/React Query/SWR |
| Backend contract | REST JSON API (Node/Express) for auth, students, and progress. Analytics, by contrast, reads from a large static JSON blob baked into its own bundle at build time — no live API calls for its numbers |
| Responsive approach | Single fluid layout with a max-width container and CSS media queries — no separate mobile app or distinct mobile routes |

---

## Repository structure

```
Asha_kanini/
├─ index.html               # Vite entry point (single-page app)
├─ vite.config.js
├─ vercel.json               # Vercel deploy config
├─ package.json               # frontend deps: react, recharts, lucide-react
├─ src/
│  ├─ main.jsx                # renders <App/> or <Analytics/> based on URL path
│  ├─ App.jsx                 # the whole trail app (~1,580 lines, single file)
│  ├─ App.css / index.css     # global styles for the trail app
│  └─ Analytics.jsx           # the whole analytics dashboard (~1,110 lines, single file)
└─ backend/
   ├─ src/
   │  ├─ index.js             # Express app entry, CORS, route mounting
   │  ├─ db/pool.js            # Postgres connection pool
   │  ├─ middleware/auth.js    # JWT verify/sign
   │  └─ routes/
   │     ├─ auth.js            # register/login/refresh/logout
   │     ├─ students.js        # CRUD for student profiles
   │     └─ progress.js        # mark/unmark a resource complete
   ├─ migrations/001_init.sql  # Postgres schema (teachers, students, progress, refresh_tokens)
   ├─ scripts/migrate.js
   ├─ .env.example
   └─ README.md
```

Both `Analytics.jsx` and `App.jsx` are large single-file components (no sub-folder-per-feature split). Styling throughout is a `<style>` tag embedded directly in each component — plain CSS custom properties (`--bg`, `--teal`, etc.) define the dark navy/teal Analytics theme.

---

## Frontend architecture

### Routing — there is no router
This app does not use React Router or any routing library. `src/main.jsx` does a manual check:

```js
const isAnalytics = window.location.pathname.startsWith('/analytics')
createRoot(...).render(isAnalytics ? <Analytics/> : <App/>)
```

So `/` and everything else renders `<App/>`, and `/analytics` (or `/analytics/anything`) renders `<Analytics/>`. This is a deliberate simplification — originally the two were separate Vite multi-page entries (`index.html` + `analytics.html`), which broke in production because `vite build` only bundles the entry listed in `vite.config.js` (see [Bug history](#bug-history--why-the-code-looks-the-way-it-does)). Merging them into one entry with a path check fixed it permanently.

**Consequence:** `vercel.json` must rewrite every path to `/index.html` so a hard refresh or direct link to `/analytics` doesn't 404 at the hosting layer before React even loads.

### `App.jsx` — the Trail app
Single component, ~1,580 lines. Key pieces:

- **`DATA`** — a large hardcoded JSON object embedded directly as a JS constant, shaped like `{ subject, medium, classes: { "1": { "I": [ { topic, total_resources, items: [{title, desc, type, package, url, ...}] } ] } } }`. This is the entire content catalog — hundreds of resources per class, scraped/curated from Diksha, Khan Academy, and the other sources listed above. It's static data baked into the bundle, not fetched from an API.
- **View state** (`useState`): `view` (`"home" | "topic" | "search" | "account"`), `selectedClass`, `term`, `topicIdx`, `completed` (a `Set` of completed resource keys), plus auth state (`teacher`, `accessToken`, `students`, `selectedStudentId`).
- **`apiFetch()`** — a thin fetch wrapper that talks to the backend for auth, student list, and progress tracking. `API_BASE` resolves to `import.meta.env.VITE_API_BASE` in production (must be set in Vercel env vars) or falls back to `http://<hostname>:4000` for local dev.
- **Auth UI** — login/register forms; JWT stored in React state (`accessToken`); refresh token in an `httpOnly` cookie (handled entirely by browser + backend, never touched by JS).
- **Nav bar** — Trail / Search / Analytics (a plain `<a href="/analytics">`, full page load, not a client-side transition) / Log in / points badge.

### `Analytics.jsx` — the dashboard
Single component, ~1,110 lines, six tabs:

| Tab | Content |
|---|---|
| Overview | KPI cards (schools assessed, students assessed, average score, participation rate, years of data, schools using the app) + a "quick read" bar chart of average score by subject/class |
| Performance | Score trends and comparisons — pre-existing before the School Averages/Assessment Analysis additions |
| School Averages *(added)* | Heatmap table of every school's average score per class/subject, a ranking of schools, and an oral-assessment-status breakdown |
| Assessment Analysis *(added)* | Overall score trends, oral-progression line charts, and questionwise written-assessment bar charts, all switchable by year |
| What Influences Scores | Correlation-style charts (mother's/father's education level, tuition, breakfast, homework, oral-vs-written performance, etc.) |
| Content Engagement | Usage data — top actions, top subjects/content opened, schools using the app per year |

All of this data is baked into the file as static JS constants (`DATA`, `REAL_DATA`, `SCHOOL_PROFILE`) — there is no live API call from `Analytics.jsx` to any backend. This was a deliberate choice: building a real backend + database + API for this dataset was out of scope; instead the numbers were pre-computed from a SQL dump and embedded directly, the same pattern the file already used before these additions.

Charts are built with Recharts (`BarChart`, `LineChart`, `ScatterChart`). Icons are from lucide-react. No other UI libraries.

---

## Backend architecture

Plain Node.js + Express + PostgreSQL, in `backend/`. Deployed separately from the frontend (on Render).

### Schema (`migrations/001_init.sql`)
Four tables:

- **`teachers`** — `id` (uuid), `name`, `email` (unique), `password_hash` (bcrypt), `school_name`, `created_at`. This is the only login-capable account type; students don't log in themselves in v1.
- **`students`** — `id`, `teacher_id` (FK), `name`, `class_level` (1–8), `pin_hash` (unused, reserved for future student self-login), `avatar_seed`, `created_at`.
- **`progress`** — one row per (student, subject, resource) completion: `student_id`, `subject`, `class_level`, `term`, `topic`, `resource_key`, `completed_at`. `resource_key` mirrors the frontend's stable key format `${classLevel}-${term}-${topic}-${title}`. Unique constraint on `(student_id, subject, resource_key)` so marking the same thing twice is a no-op.
- **`refresh_tokens`** — `id`, `teacher_id`, `token_hash` (sha256), `expires_at`, `revoked`. Supports the rotating-refresh-token auth pattern below.

### Auth flow
- **Access token:** JWT, signed with `JWT_ACCESS_SECRET`, 15-minute expiry, contains `{ sub: teacherId }`. Sent as `Authorization: Bearer <token>` on every protected request. Kept in React state on the frontend (not `localStorage`), reducing XSS exposure, per the backend README's own reasoning.
- **Refresh token:** a random 48-byte hex string; only its SHA-256 hash is stored in `refresh_tokens`. Sent to the browser as an `httpOnly` cookie scoped to path `/api/auth`, `Secure` + `SameSite=None` in production (required for a cross-site cookie between the Vercel frontend and Render backend domains), `SameSite=Lax` in dev. 30-day expiry, rotated on every use (`POST /api/auth/refresh` revokes the old one and issues a new one).
- **Login rate limiting:** `express-rate-limit`, 10 attempts per 15 minutes per IP on `/api/auth/login`.
- **Login responses are shaped identically** whether or not the email exists (a dummy bcrypt compare runs even on a miss) to avoid leaking which emails are registered.

### Routes

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/health` | – | `{ ok: true }`, used to verify the backend is up |
| POST | `/api/auth/register` | – | `name`, `email`, `password` (min 8 chars), optional `schoolName` |
| POST | `/api/auth/login` | – | rate-limited |
| POST | `/api/auth/refresh` | refresh cookie | rotates token |
| POST | `/api/auth/logout` | refresh cookie | revokes it |
| GET/POST | `/api/students` | Bearer | list / create |
| PATCH/DELETE | `/api/students/:id` | Bearer | update / remove |
| GET/POST | `/api/students/:id/progress` | Bearer | list / mark complete |
| DELETE | `/api/students/:id/progress/:resourceKey` | Bearer | un-mark |

Anything unmatched returns `404 { error: "Not found" }`; unhandled errors return `500 { error: "Something went wrong" }` (stack traces are logged server-side only, never sent to the client).

### CORS
`CORS_ORIGINS` env var (comma-separated) whitelists exact frontend origins in production. In non-production (`NODE_ENV !== "production"`), the backend reflects back whatever origin made the request — convenient for local dev, deliberately permissive.

---

## How the Analytics numbers are actually computed

The **School Averages** and **Assessment Analysis** tabs don't exist on any external reference system independently — they were built by reverse-engineering the visual structure of five pages from `kanini.ashanet.org` (Asha for Education's separate internal reporting portal, viewed via screen recording) and then computing real numbers from scratch against a SQL dump of the underlying database, because the portal's own backend source code was never available — only what it visually displayed.

### Source data
A ~11MB MySQL dump (database `samplekanini`) was provided, containing 30+ tables. Key ones actually used:

- **`assessmentpaper`** — one row per (assessment type, class, subject, academic year) paper, with `MaxMarks`, `NumberOfQuestions`.
- **`assessmentresultgroup`** — links a paper to a school + section + year + a `FullOral` flag (oral vs. written).
- **`assessmentscores`** — one row per student per paper: `Marks`, `StudentStatusID` (for oral assessments, a categorical level instead of a mark).
- **`assessmentdetailedscores`** + **`assessmentquestions`** — per-question marks, for the "questionwise" breakdowns.
- **`assessmentstudentstatus`** — the 21 oral-achievement categories (Pre Letter, Capital Letter, ... Direct Test for English; Pre Numbers ... Division for Maths; Letter ... Paragraph for Tamil).
- **`schoolclassdetails`** — enrolled student counts per school/class/year, used as the denominator in "attempted / enrolled" fractions.
- **`schooldetails`** — per-school-per-year profile data: `RTEScore`, `STPercent`, `SCPercent`, `TotalPrimaryTeachers`, `StrengthThisYear`, `Attendance_Avg`, `BPLPercent`. Not used by the original portal views shown, but pulled in separately for the ranking feature.
- **`schools`** has no name field — only `SchoolID`, `cluster_id`, `pincode`, `categoryId`, `locationId`, `organizationID`. There are no school names anywhere in this dump. Every school in the Analytics page is labeled `School #<SchoolID>`, per explicit instruction, since no name exists to show.

**Important sampling caveat:** `assessmentscores` (and most other tables) are capped at exactly 20,000 rows each — this is a *sample* extract, not the full production database. `assessmentresultgroup` references result IDs up to ~41,868, but `assessmentscores`'s sample only covers IDs up to ~20,903, which happens to correspond to roughly 2016–2022. This is why written/oral score coverage is good for 2016–2020, thin for 2022, and effectively zero for CS (Computer Science) assessments, whose papers only start in academic year 2024 — those result IDs are numerically higher than anything included in the sampled table. The "CS Results" toggle in School Averages shows an explicit "no data in this sample" message rather than fabricating numbers.

### "School Averages" tab — computation
Mirrors the portal's `school_avgs` (regular schools, classes 1–6, English/Maths) and `cs_school_avgs` (CS, classes 4/5/7/8) views, merged into one tab with a toggle. For each (school, class, subject) combination, for a selected year:

- **`avg`** = mean of `assessmentscores.Marks` across all students in that school/class/subject/year (only for papers with `MaxMarks > 0`, since class 1 has no written test — those cells correctly show "nil").
- **`attempted`** = count of distinct students with a score.
- **`total`** = `schoolclassdetails.noOfStudents` summed across sections for that school/class/year (falls back to `attempted` if no enrollment record exists).
- **Heatmap color:** green when the average is ≥60% of `MaxMarks`, red/maroon when <35%, neutral otherwise — a simplified version of the portal's own red/green highlighting (exact thresholds weren't recoverable from the visual recording, since it doesn't reveal the source logic; these are reasonable approximations, not a verified match).

The Oral Assessment Status sub-table (% of students at each achievement level, per subject, per class) is computed by grouping `assessmentscores` rows (joined to `assessmentstudentstatus`) by (class, subject, status) where `FullOral = 1`, and dividing by the total assessed in that class/subject.

### "Assessment Analysis" tab — computation
Mirrors three portal views (`assmt_analysis`, `oral_assmt_analysis`, `written_assmt_analysis`), merged into one tab with three sub-views:

- **Overall Scores** — per subject, per class: average written score as a % of max marks, plus an "oral progress" proxy computed as the mean ordinal position of each student's achieved status within that subject's status list (e.g. reaching "Direct Test", the last of 8 English levels, scores 100%; "Pre Letter", the first, scores 0%). This ordinal-position proxy stands in for whatever numeric "oral score" the real portal computes — the recording didn't reveal its exact formula.
- **Oral Assessment** — cumulative % of students who reached *at least* each level, by class, per subject — directly countable from the status data, no proxy needed here.
- **Written Assessment** — per class + subject, average % score per individual question (`assessmentdetailedscores` ÷ `assessmentquestions.QuestionMarks`), matching the portal's per-question bar charts.

**Known simplification:** the real portal's `written_assmt_analysis` and `assmt_analysis` views let you compare two different sample groups (e.g. two years, or two school subsets) side by side. This dump has no clean second cohort to compare against in a meaningful way, so these charts show a single "all schools" series per year instead of two overlaid series. This is stated directly in the tab's own subtitle in the UI, not hidden.

**Year selector:** both tabs let you pick from `[2016, 2017, 2018, 2019, 2020, 2022]` — the years with actual score data in the sample. Selecting a year re-renders from pre-computed data baked into the file for that year (all six years' worth of numbers are embedded as one JSON blob, not fetched live).

### Ranking + RTE correlation (School Averages tab)
Added on request: a Top 10 / Bottom 10 ranking of schools by average score (weighted mean of avg/max across every class/subject cell the school has data for that year, weighted by students assessed; schools with fewer than 2 populated cells are excluded as too thin to rank fairly), plus a scatter chart of RTE Score vs. average assessment score per school, pulling in the previously-unused `schooldetails.RTEScore` field. This chart only renders when a year has at least 5 schools with an RTE score on record (RTE coverage is good 2017–2020, absent for 2022).

---

## Design system

Two intentionally distinct visual systems, by design:

- **Trail app** (student-facing/teacher-daily-use) — **light theme**. Warm, approachable palette: deep green header/nav bar, orange as the primary accent/CTA color (buttons, active-state badges), white/cream content cards. Rounded, friendly iconography (a mascot-style logo mark was used in earlier reference screenshots). Optimized for quick scanning by a non-technical user on possibly low-end devices.
- **Analytics dashboard** (coordinator/data-analysis-facing) — **dark theme**. Navy/near-black backgrounds (`--bg: #0F1729`, `--bg-2: #1A2540`, `--bg-3: #212D4D`) with teal (`#5EEAD4`) as the primary accent, amber/gold and violet/pink as secondary series colors for multi-line charts. Typography mixes a display sans (Space Grotesk) for headings, a standard sans (Inter) for body text, and a monospace (JetBrains Mono) for numeric/data values — a deliberate "data dashboard" feel distinct from the friendlier Trail app.

**Layout structure:**
- Top nav bar, not a sidebar, in both apps — horizontal tabs for primary navigation (Trail/Search/Analytics/Account in the main app; Overview/Performance/School Averages/Assessment Analysis/What Influences Scores/Content Engagement as a tab strip in Analytics).
- Content is contained within a max-width column, centered, with generous padding — not edge-to-edge/full-bleed layouts.
- Analytics uses pill-style toggle controls (not dropdowns) for anything with 2–4 mutually exclusive options (Top10/Bottom10, subject switches, sub-view switches); dropdowns are reserved specifically for the year selector, which has more than 4 options.
- Data tables use a sticky first column so row labels (school IDs, class numbers) stay visible while scrolling horizontally on narrow screens.

**Responsiveness:**
- Must degrade gracefully to mobile-width viewports (explicitly tested at ~380px during development) — pill rows wrap, wide data tables scroll horizontally rather than compress illegibly, charts resize fluidly via `ResponsiveContainer`.
- No distinct "mobile app" — a single responsive web app throughout.

**Tone/content constraints (treated as standing rules, not one-off decisions):**
- Wherever a number is derived or approximated rather than directly sourced (e.g., color-band thresholds, the oral-progress proxy score, RTE correlation), the UI carries a visible caption or callout saying so — a hard requirement throughout the Analytics build.
- Empty/no-data states must always explain *why* data is missing (e.g., "CS papers only start 2024") rather than showing a bare empty table or chart — this pattern repeats across nearly every Analytics page.

---

## Deployment

- **Frontend:** Vercel, static Vite build. `vercel.json` is intentionally minimal:

  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

  This is required because there's no server-side router — every path must fall back to `index.html` so `main.jsx`'s client-side path check can take over. An earlier version of this file used Vercel's newer "services" framework block, which caused a real production 404 on `/analytics` (see below) and doesn't provide this fallback automatically.

- **Backend:** Render, plain Node process + a Postgres instance. Free-tier Render sleeps when idle — the first request after inactivity can take 30–50 seconds.

- **Environment variables that must be set:**
  - **Frontend (Vercel):** `VITE_API_BASE` — the Render backend's full URL (e.g. `https://asha-kanini.onrender.com`, no trailing slash — though the code now strips one defensively either way).
  - **Backend (Render):** `DATABASE_URL`, `JWT_ACCESS_SECRET` (generate with `openssl rand -hex 32`), `CORS_ORIGINS` (the Vercel domain), `NODE_ENV=production`, `PGSSL` (leave default/true for managed Postgres).

---

## Bug history — why the code looks the way it does

Understanding these matters for understanding a few non-obvious choices in the code:

1. **Analytics page 404'd in production.** Root cause: the project used to have two separate Vite entry points (`index.html` + `analytics.html`, each with its own `main.jsx`/`analytics-main.jsx`), but `vite.config.js` never registered `analytics.html` as a build input. `vite build` only bundles the default entry, so `analytics.html` silently didn't exist in the production output — a 404 on Vercel, while it worked locally only because Vite's dev server serves any `.html` file it finds on disk. **Fix:** merged into one entry (see [Routing](#routing--there-is-no-router)).

2. **Second layer of the same bug:** even after merging entries, `/analytics` still 404'd — this time at the Vercel routing layer itself, before React loaded. Root cause: `vercel.json` used Vercel's "services" framework config, which doesn't automatically fall back unmatched paths to `index.html` the way a plain Vite static site needs. **Fix:** replaced with the plain `rewrites` block shown in [Deployment](#deployment), and the Vercel project's Framework Preset setting had to be changed from "Services" back to "Vite" to match.

3. **Backend unreachable in production.** `API_BASE` was hardcoded as `` http://${window.location.hostname}:4000 `` — fine for local dev, completely broken once deployed (nothing listens on port 4000 on the Vercel domain, and browsers block plain HTTP from an HTTPS page anyway). **Fix:** read from `import.meta.env.VITE_API_BASE`, falling back to the old dev pattern only when that's unset. Also added `.replace(/\/+$/, "")` to strip any trailing slash from the env var, since a trailing slash there would double up with the leading slash on every API path and produce a URL Express won't route (`//api/auth/register`).

**Unresolved security note:** a real `backend/.env` file (not just `.env.example`) exists in the working tree, and `.gitignore` never excluded `.env`. If it was ever committed and pushed, its contents (`DATABASE_URL`, `JWT_ACCESS_SECRET`) should be treated as compromised — rotate them. This documentation does not confirm either way whether it's actually in git history; that needs checking directly on GitHub.

---

## Data checked and confirmed not usable

For completeness — these were explicitly checked so nothing is silently missing from Analytics:

- **SA1/SA2/SA3** assessment types (as opposed to "AAA") exist as labels in the `assessments` table but have zero papers or scores anywhere in the dump — nothing was left out, there's simply nothing to show.
- **CS assessment scores** — confirmed zero rows in the sampled `assessmentscores` for `Subject = 'CS'`, for the reason described in the sampling caveat above.
- **School names** — confirmed absent from the `schools` table and every table joined to it.
- **`schooldetails.Attendance_Avg`** and **`BPLPercent`** — present but mostly `NULL` before 2020, only reliably populated for 2020 and 2022, so not used for the ranking correlation (RTE Score was used instead, which has broader coverage). These fields are still sitting unused in the data and could power an additional chart if wanted.
- **`schoolteachers`, `cluster`, `schoolcategorytypes`, `schooltype`, `preschoollevel`, `tutiontypes`** — present in the schema, browsed, but not wired into the "What Influences Scores" tab (that tab already existed before these additions and uses `educationlevel`/`occupation_levels` instead) — not touched, not verified against the live portal, noted here in case someone wants to extend that tab later.

---

## Known limitations & open questions

- The dataset behind Analytics is a **sample extract** (~20,000 rows per table) of a larger production database — treat exact figures throughout as illustrative, not authoritative.
- Coverage is strong for 2016–2020, thin for 2022, and empty for Computer Science assessments (which only start in academic year 2024).
- Schools have no name field in the data; they're labeled `School #<ID>` throughout, per explicit instruction.
- The Assessment Analysis charts show a single "all schools" series per year rather than a true side-by-side cohort comparison, since the sample has no clean second cohort — this is stated directly in the UI subtitle, not hidden.
- Heatmap color-band thresholds and the oral-progress ordinal proxy are reasonable approximations of the original portal's logic, not verified matches — the portal's own source code was never available, only a screen recording of its output.
- Fuzzy/typo-tolerant search is an open design question, not yet confirmed in scope.
- Whether `backend/.env` was ever committed to git history is unconfirmed and needs to be checked directly on GitHub; if so, treat `DATABASE_URL` and `JWT_ACCESS_SECRET` as compromised and rotate them.

---

## Glossary

- **AAA** — the name of the (only) assessment type with real data in this dump; the annual assessment.
- **Full Oral** — a flag on `assessmentresultgroup` distinguishing an oral (status-based, no numeric mark) assessment from a written (numeric marks) one.
- **StudentStatusID / Status** — the categorical oral-achievement level a student reached (e.g. "Small Letter", "Two Digit Numbers"), ordered from least to most advanced per subject.
- **School #\<ID\>** — how every school is labeled in Analytics, since no name field exists in the sampled data.
- **Sample dump** — the provided SQL file is a ~20,000-row-per-table extract of a larger production database, not the full dataset; treat exact figures throughout as illustrative, not authoritative.

---

## Getting started

### Frontend

```bash
npm install
npm run dev
```

Set `VITE_API_BASE` (in Vercel env vars or a local `.env`) to the backend's URL for the Trail app's auth/progress features to work. Analytics needs no backend connection since its data is bundled at build time.

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_ACCESS_SECRET, CORS_ORIGINS
npm run migrate
npm start
```

Verify it's up with `GET /api/health` → `{ ok: true }`.

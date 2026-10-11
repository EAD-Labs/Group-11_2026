# Kanini Padhai — Backend API Service

Production-grade Node.js + Express backend service powering **Kanini Padhai** and **Asha Insights**.
Provides database-backed authentication, role-based access control (RBAC), AI-powered visual conversational analytics, dynamic curriculum delivery, and student progress tracking.

---

## 1. Environment Variables Configuration

The backend requires a `.env` file in the `backend/` directory for local development, or matching environment variables set in your cloud hosting provider (e.g., Render, Railway, AWS).

### Quick `.env` Template

Create a file named `.env` inside `backend/` (or copy from `.env.example`):

```env
# ==============================================================================
# 1. DATABASE & SERVER CONFIGURATION
# ==============================================================================
PORT=4000
NODE_ENV=development

# Neon PostgreSQL connection string (include ?sslmode=require for managed cloud Postgres)
DATABASE_URL=postgresql://user:password@ep-late-base.region.aws.neon.tech/neondb?sslmode=require
PGSSL=true

# JWT Token Secret: 32+ character random string (generate with: openssl rand -hex 32)
JWT_ACCESS_SECRET=your_32_byte_random_jwt_secret_key_here

# ==============================================================================
# 2. CORS & DOMAIN WHITELISTING (CRITICAL FOR VERCEL DEPLOYMENTS)
# ==============================================================================
# Comma-separated list of allowed frontend origins (NO trailing slashes)
CORS_ORIGINS=http://localhost:5173,https://asha-kanini-mu.vercel.app

# ==============================================================================
# 3. GOOGLE OAUTH & ROLE-BASED ACCESS CONTROL (RBAC)
# ==============================================================================
# Web Client ID from Google Cloud Console (APIs & Services -> Credentials)
GOOGLE_CLIENT_ID=243068372849-remignv15mrub27mci97l0qdrlk15icq.apps.googleusercontent.com

# Comma-separated list of emails granted ADMIN privileges upon login
ADMIN_EMAILS=arjoe.basak@gmail.com,client@example.com

# Default role assigned to authenticated Google accounts without school assignment
# Options: GUEST (masked aggregate analytics) or ASHATEACHER (full teacher permissions)
GOOGLE_OAUTH_DEFAULT_ROLE=ASHATEACHER

# ==============================================================================
# 4. AI CHATBOT & MULTI-MODEL LLM ENGINE
# ==============================================================================
# Primary Provider: 'gemini' (Google) or 'groq'
LLM_PROVIDER=gemini

# Google Gemini API (Get key from https://aistudio.google.com/)
GEMINI_API_KEY=your_google_ai_studio_api_key_here
# Recommended models:
# - gemini-3.8-flash (ultra-fast, free tier supported)
# - gemini-3.1-pro-preview (deep reasoning, requires linked billing account)
GEMINI_MODEL=gemini-3.8-flash

# Groq API Fallback (Get key from https://console.groq.com/keys)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

---

### Variable Reference & Guide for the Client

| Environment Variable | Required? | Description & Instructions | Example Value |
| :--- | :---: | :--- | :--- |
| **`DATABASE_URL`** | **Yes** | Full PostgreSQL connection URI. Works with Neon, Supabase, Render Postgres, or AWS RDS. | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| **`PGSSL`** | **Yes** | Enforces SSL encryption for database communication. Set to `true` for Neon and cloud databases. Set `false` only for local non-SSL Postgres. | `true` |
| **`JWT_ACCESS_SECRET`** | **Yes** | Secret cryptographic key used to sign and verify session JWTs. Generate with `openssl rand -hex 32`. | `e3b0c44298fc1c149afbf4c8996fb924...` |
| **`CORS_ORIGINS`** | **Yes** | **Crucial for Vercel.** Comma-separated list of frontend URLs permitted to call this API. If the Vercel domain is not listed here, browsers will block requests with a CORS error. | `http://localhost:5173,https://asha-kanini-mu.vercel.app` |
| **`GOOGLE_CLIENT_ID`** | **Yes** | OAuth 2.0 Web Client ID from Google Cloud Console. Used by backend to verify identity tokens upon Google login. | `243068372849-...apps.googleusercontent.com` |
| **`ADMIN_EMAILS`** | **Yes** | Comma-separated emails that receive the **`ADMIN`** role upon signing in. Admins have unmasked access to all schools, student records, and the AI visualizer. | `arjoe.basak@gmail.com,client@example.com` |
| **`GOOGLE_OAUTH_DEFAULT_ROLE`** | No | Fallback role for signed-in Google users not listed in `ADMIN_EMAILS`. Set to `ASHATEACHER` for volunteer teachers or `GUEST` for read-only masked views. | `ASHATEACHER` |
| **`LLM_PROVIDER`** | No | Determines default AI model orchestrator. Options: `gemini` or `groq`. | `gemini` |
| **`GEMINI_API_KEY`** | Conditional | API key from [Google AI Studio](https://aistudio.google.com/). Required for Gemini 3.8 Flash and Gemini 3.1 Pro inference. | `AIzaSy...` |
| **`GEMINI_MODEL`** | No | Specific Gemini model identifier. Default is `gemini-3.8-flash`. If Google Cloud billing is enabled, set to `gemini-3.1-pro-preview`. | `gemini-3.8-flash` |
| **`GROQ_API_KEY`** | Conditional | API key from [Groq Console](https://console.groq.com/). Required if `LLM_PROVIDER=groq` or as automated fallback. | `gsk_...` |
| **`NODE_ENV`** | **Yes** | Application environment. Use `development` locally and `production` when deployed. | `production` |
| **`PORT`** | No | Port on which the Express server listens (defaults to `4000`). | `4000` |

---

## 2. Cloud Deployment (Render / Railway / VPS)

### Deploying to Render
1. Create a **New Web Service** connected to your GitHub repository (`Asha_kanini`).
2. Set:
   * **Root Directory:** `backend`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
3. Under **Environment Variables**, add the variables from the table above.
4. Note your public backend URL (e.g. `https://asha-kanini-api.onrender.com`).
5. **In Vercel:** Open Vercel Project Settings → Environment Variables, and set:
   * `VITE_API_BASE = https://asha-kanini-api.onrender.com` (no trailing slash).
   * `VITE_GOOGLE_CLIENT_ID = 243068372849-remignv15mrub27mci97l0qdrlk15icq.apps.googleusercontent.com`.

---

## 3. API Route Directory

| Group | Method | Endpoint | Auth | Purpose |
| :--- | :---: | :--- | :---: | :--- |
| **Health** | `GET/HEAD` | `/api/health` | Public | Lightweight ping probe for connectivity detection and uptime monitoring. |
| **Auth** | `POST` | `/api/auth/register` | Public | Standard teacher signup (name, email, password, school). |
| | `POST` | `/api/auth/login` | Public | Standard teacher login; issues JWT and refresh cookie. |
| | `POST` | `/api/auth/google` | Public | Google OAuth 2.0 verification and role assignment. |
| | `POST` | `/api/auth/guest-token` | Public | Issues guest token for read-only masked exploration. |
| | `POST` | `/api/auth/refresh` | Cookie | Rotates refresh token and issues new access token. |
| | `GET` | `/api/auth/me` | Bearer | Returns user profile, active role, and school scope. |
| **AI Insights** | `POST` | `/api/analytics/chat` | Bearer/Optional | Natural language query engine using Gemini/Groq with database tool-calling. |
| **Content** | `GET` | `/api/content/directory` | Public | Full curriculum catalog (Classes 1–8) with Assessment Slice badges and pedagogical phases. |
| | `GET` | `/api/content/lesson-plans` | Public | Searchable digital lesson plans with query and term filtering. |
| **Analytics** | `GET` | `/api/analytics/overview` | Bearer/Optional | Live KPIs (`total_schools`, `total_students`, `avg_score_pct`) and subject matrices. |
| | `GET` | `/api/analytics/performance` | Bearer/Optional | Class-by-class performance, multi-year trends, and topic accuracy. |
| | `GET` | `/api/analytics/school-performance` | Bearer/Optional | Per-school averages, max marks, student participation, RTE scores. |
| | `GET` | `/api/analytics/assessments/analysis` | Bearer/Optional | Written score curves, oral progression, and question difficulty breakdown. |
| | `GET` | `/api/analytics/influences/summary` | Bearer/Optional | Correlations for parental education, tuition, breakfast, homework, gender. |
| | `GET` | `/api/analytics/engagement/summary` | Bearer/Optional | App usage telemetry actions, popular subjects, and top lessons. |
| **Students** | `GET/POST`| `/api/students` | Bearer | List or create student profiles under logged-in teacher. |
| | `GET/POST`| `/api/students/:id/progress` | Bearer | Track completed trail stops (supports offline outbox sync replay). |

---

## 4. Local Development

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Copy and configure environment variables
cp .env.example .env

# 3. Start development server with auto-reload
npm run dev
# Server listens at http://localhost:4000
```

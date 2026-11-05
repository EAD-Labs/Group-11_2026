# Kanini Padhai & Asha Insights

> ### 🌐 [View Project Introduction Page &rarr;](https://asha-kanini-mu.vercel.app/intro.html)
> *Start with our **[Project Introduction Webpage](https://asha-kanini-mu.vercel.app/intro.html)** (source: [`public/intro.html`](./public/intro.html)) for an overview of the rural education challenge, target users, and how our solution works.*
>
> ### 🚀 [Launch Live Application &rarr;](https://asha-kanini-mu.vercel.app)
> - **Main Application Entry:** [https://asha-kanini-mu.vercel.app](https://asha-kanini-mu.vercel.app) *(Access the Learning Trail, Analytics Dashboard, and AI Visualizer directly from the top navigation bar).*

---

## 1. What is Kanini Padhai?

**Kanini Padhai** (*"Computer Learning"* in Tamil) is a bilingual (Tamil/English), offline-first learning-resource hub and longitudinal assessment analytics platform built for **Asha for Education**.

Across rural and panchayat primary schools in Tamil Nadu, educators face three persistent barriers:
1. **Unreliable Connectivity:** Frequent internet and power outages interrupt digital lessons and cause progress loss.
2. **Resource Discovery Overload:** Volunteer tutors struggle to organize hundreds of scattered videos, games, and worksheets into a structured classroom sequence.
3. **The Assessment Blind Spot:** Across 38,000+ student assessments, many children understand concepts orally but struggle on written tests due to early literacy bottlenecks—requiring deeper diagnostic visibility for NGO coordinators.

---

## 2. Target Users & Core Features

| Target User | Primary Module | What It Does |
| :--- | :--- | :--- |
| **Volunteer Teachers & Tutors** | **The Learning Trail** | Organizes **958+ bilingual resources** (Diksha, Khan Academy, Math Playground, etc.) across **Classes 1–8** and **Terms I–III** following a **Concrete → Representational → Abstract (CRA)** progression. Includes **1-click IndexedDB offline caching** and per-student progress tracking that automatically syncs when internet returns. |
| **School Principals & NGO Coordinators** | **Analytics Dashboard** | A **6-tab longitudinal dashboard** analyzing multi-year Asha Annual Assessment (AAA) data across **62 schools**: program KPIs, School Average heatmaps, Top/Bottom 10 rankings, **Oral vs. Written progression analysis**, socioeconomic influences, and automated **L5 Impact Reports**. |
| **Education Analysts & Leadership** | **AI Visualizer** | A conversational analytics copilot powered by deterministic SQL/tool execution (Gemini / Llama 3.3 70B). Users ask plain-English questions (e.g., *"Compare Maths and English trends across classes"*) to generate verified multi-chart layouts with role-based privacy masking. |

---

## 3. How to Access & Test the Application (30-Second Evaluator Guide)

You can access the live hosted application immediately at **[https://asha-kanini-mu.vercel.app](https://asha-kanini-mu.vercel.app)**—no installation required:

1. **Browse the Learning Trail:** Select any **Class (1–8)** and **Term (I–III)** on the home screen, then click a topic to explore curated bilingual videos, interactive games, and worksheets.
2. **Use 1-Click Evaluator Demo Profiles:** Click **Account** in the top navigation bar and select any **1-Click Evaluator Demo Profile** (*Admin*, *Asha Teacher*, *Principal*, or *Guest*) to test student progress tracking and role-based permissions without typing credentials.
3. **Test Offline Mode & Mobile QR Pairing:**
   - Click **Offline** in the navbar to download class trails into browser `IndexedDB` storage for zero-internet teaching.
   - Click **Mobile** in the navbar to scan a dynamic QR code and open the Progressive Web App on your phone.
4. **Explore Analytics & AI Visualizer:** Click **Analytics** or **AI Visualizer** (when signed in as Teacher/Admin) in the top bar to inspect school heatmaps, oral-vs-written skill breakdowns, and natural-language chart generation.

---

## 4. How to Run Locally

### Prerequisites
- **Node.js** v18+ and **npm**

### Step 1: Run the Frontend
```bash
# Install frontend dependencies
npm install

# Start the local Vite development server (http://localhost:5173)
npm run dev
```
*(Note: The Learning Trail catalog and baseline Analytics data are bundled with the frontend, so the app runs out-of-the-box even before configuring a local backend.)*

### Step 2: Run the Backend API (Optional for Local Auth, DB Sync & AI Chat)
```bash
cd backend
npm install

# Copy the example environment file and fill in your credentials
cp .env.example .env

# Run database schema migrations (PostgreSQL) and start the server on port 4000
npm run migrate
npm start
```
See [`backend/README.md`](./backend/README.md) for detailed environment variable descriptions (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `CORS_ORIGINS`).

---

## 5. Tech Stack & Repository Structure

- **Frontend:** React 19, Vite 8, Recharts, Lucide Icons, Browser `IndexedDB` (Offline Store-and-Forward Engine)
- **Backend:** Node.js, Express, Neon PostgreSQL (`pg`), JWT + Google OAuth 2.0, Role-Based Access Control (RBAC)
- **AI Analytics Engine:** Deterministic Tool-Calling Orchestrator supporting Google Gemini & Groq (Llama 3.3 70B)

```text
.
├── public/
│   ├── intro.html                  # Project Introduction Landing Page
│   └── favicon.svg
├── src/
│   ├── main.jsx                    # Application entry & RBAC route guard
│   ├── App.jsx                     # Bilingual Learning Trail, Student Tracker & Auth views
│   ├── Analytics.jsx               # 6-Tab Longitudinal Assessment Analytics Dashboard
│   ├── InsightsPage.jsx            # Conversational AI Visualizer (Asha Insights)
│   ├── components/                 # DynamicVisualizer, OfflineManager, L5Report, QRCode modals
│   ├── services/offlineStorage.js  # IndexedDB curriculum caching & offline progress outbox
│   └── data/                       # Bundled curriculum & baseline analytics datasets
├── backend/
│   ├── src/                        # Express API routes (auth, students, progress, analytics, chat)
│   ├── migrations/001_init.sql     # PostgreSQL schema
│   └── README.md                   # Backend configuration & deployment guide
├── vercel.json                     # Vercel routing configuration
└── README.md                       # Project documentation
```

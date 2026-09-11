# Kanini Padhai

This repository contains both the frontend and backend for the Kanini Padhai learning platform.

## Project Structure
- `src/` & `public/` - React frontend built with Vite.
- `backend/` - Node.js + Express backend API with PostgreSQL database.

## Prerequisites
- Node.js (v18 or higher recommended)
- A PostgreSQL database (e.g., Neon)

## Running the Application Locally

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template and configure it:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and set your `DATABASE_URL` (your Neon PostgreSQL connection string) and a secure `JWT_ACCESS_SECRET`.*
4. Run the database migrations (this will execute the SQL dump to create tables):
   ```bash
   npm run migrate
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:4000`.

### 2. Frontend Setup
1. Open a new terminal and navigate to the project root:
   ```bash
   cd "path/to/Kanini Padhai"
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run on the port specified by Vite (usually `http://localhost:5173`).

---

## React + Vite details

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.
Currently, two official plugins are available:
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

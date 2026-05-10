# Project Setup Guide

This guide covers how to set up **Aid** for local development and how to deploy it to production using Vercel.

---

## 💻 Local Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.9+)
- **PostgreSQL** (or a Supabase account)

### 2. Database Setup
- Create a PostgreSQL database (locally or on [Supabase](https://supabase.com)).
- Run the backend once to initialize tables, or manually run migrations if available.

### 3. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend` folder:
```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
DATABASE_URL_SYNC=postgresql://user:pass@host:port/db
SECRET_KEY=your-local-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```
Run the server:
```bash
uvicorn app.main:app --reload
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env.local` file in the `frontend` folder:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```
Run the app:
```bash
npm run dev
```

---

## ☁️ Vercel Deployment

Aid uses a **Dual-Project Deployment** strategy on Vercel to handle the React frontend and FastAPI backend separately.

### 1. Deploy the Backend
- **Root Directory**: `backend`
- **Framework Preset**: FastAPI
- **Environment Variables**: Add all variables from your `.env` file (DATABASE_URL, SECRET_KEY, etc.).
- **URL**: Once deployed, copy the production URL (e.g., `https://aid-backend.vercel.app`).

### 2. Deploy the Frontend
- **Root Directory**: `frontend`
- **Framework Preset**: Vite
- **Environment Variables**:
    - `VITE_API_BASE_URL`: Paste your **Backend URL** from the previous step.
- **Rewrites**: The `frontend/vercel.json` ensures that SPA routing works correctly.

### 3. Security (CORS)
In `backend/app/main.py`, ensure the `origins` list includes your frontend production URL to allow cross-origin requests.

---

## 🐳 Docker Setup (Best Practices)

Docker allows you to run the entire stack (Frontend, Backend, and Database) with a single command. It ensures environment consistency across all machines.

### 1. Prerequisites
- **Docker Desktop** installed and running.

### 2. How it works
- **Hot Reloading (Development)**: Our `docker-compose.yml` uses **Volumes** to map your local code into the containers. This means any edits you make in your editor will sync instantly inside Docker.
- **Nginx (Frontend)**: In the Docker environment, the frontend is served by Nginx. This is a production-grade web server that is faster than the Vite dev server and handles SPA routing (preventing 404s on page refresh).

### 3. Choose your mode

#### **Option A: Development Mode (Syncs instantly)**
Use this for daily coding. Edits in your editor will reflect instantly in the browser.
- **Frontend Port**: [http://localhost:5173](http://localhost:5173) (Vite Dev Server)
- **Backend Port**: [http://localhost:8000](http://localhost:8000)

**Command:**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

#### **Option B: Production Mode (Fast & Secure)**
Use this to test the "Real World" version of your app. It uses Nginx to serve static files. **Note**: You must rebuild if you change code in this mode.
- **Frontend Port**: [http://localhost:3000](http://localhost:3000) (Nginx)
- **Backend Port**: [http://localhost:8000](http://localhost:8000)

**Command:**
```bash
docker-compose up --build
```

### 4. Common Commands

**Stop everything:**
```bash
docker-compose down
```
*(Add `-f docker-compose.dev.yml` if you were running in Dev mode).*

### 4. Accessing the App
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000/api](http://localhost:8000/api)
- **Database**: Port `5432` on `localhost`

---

## 🛠️ Troubleshooting

- **CORS Errors**: If you see "Failed to fetch," check that your backend's `main.py` allows your frontend domain.
- **Database Connection**: Ensure your `DATABASE_URL` includes `+asyncpg` for the asynchronous SQLAlchemy driver.
- **Vercel Build Fails**: Double-check that your **Root Directory** is set correctly in the Vercel project settings.
- **Docker Build Fails**: If you add new packages, you **must** run `docker-compose up --build` to reinstall them inside the container.

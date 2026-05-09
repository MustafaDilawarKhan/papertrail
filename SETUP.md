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

## 🛠️ Troubleshooting

- **CORS Errors**: If you see "Failed to fetch," check that your backend's `main.py` allows your frontend domain.
- **Database Connection**: Ensure your `DATABASE_URL` includes `+asyncpg` for the asynchronous SQLAlchemy driver.
- **Vercel Build Fails**: Double-check that your **Root Directory** is set correctly in the Vercel project settings.

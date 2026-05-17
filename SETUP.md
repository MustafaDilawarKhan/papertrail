# Project Setup Guide

This guide covers how to set up **Paper Trail** for local development and how to deploy it to production using Vercel.

---

## 💻 Local Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.9+)
- **Supabase account** (database + storage is hosted on Supabase — no local PostgreSQL needed)

### 2. Database Setup
- Create a project on [Supabase](https://supabase.com).
- Go to **Project Settings → Database → Connection String** and copy the **Transaction Pooler** URL.
- Go to **Project Settings → API** to copy your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Create a Storage bucket named `AID_DOC` (or match your `SUPABASE_STORAGE_BUCKET` value).

### 3. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```
```env
# Supabase PostgreSQL (Transaction Pooler)
DATABASE_URL=postgresql+asyncpg://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
DATABASE_URL_SYNC=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# JWT Authentication
SECRET_KEY=your-super-secret-key-change-me
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DEBUG=False

# File Uploads
UPLOAD_DIR=./uploads

# Supabase Storage
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=AID_DOC

# AI Chat (OpenRouter) — required for document-grounded chat
# Sign up at https://openrouter.ai/ and create a key.
OPENROUTER_API_KEY=sk-or-v1-...
# Optional overrides (defaults shown):
# OPENROUTER_MODEL=openai/gpt-oss-120b:free
# OPENROUTER_FALLBACK_MODELS=nvidia/nemotron-3-super:free,z-ai/glm-4.5-air:free
# OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

> **About the fallback chain:** If the primary model is rate-limited or
> unavailable, the backend automatically tries each model in
> `OPENROUTER_FALLBACK_MODELS` (in order) **before any tokens stream out**.
> Once a model has started streaming, errors are surfaced rather than
> retried — otherwise the user would see duplicated output. All three
> defaults are free-tier models on OpenRouter, so no budget is required.

After installing or updating dependencies, run the DB migration to add the
`documents.extracted_text` column the AI chat depends on:

```bash
python alter_db.py
```

### Admin access

The admin dashboard (`/admin/*` in the UI, `/api/admin/*` on the backend) is
gated on a `users.is_admin` flag.

**Bootstrap admin credentials** (created automatically by `create_admin.py`,
or by the running stack on first migration):

```
Email:    admin@pt.com
Password: admin123
```

> **Rotate immediately.** Sign in once, then go to **Admin → My account** and
> use the **Change password** form. The credentials above are only
> appropriate for a fresh dev / demo install.

If `admin@pt.com` doesn't exist yet, create it:

```bash
docker compose -f docker-compose.dev.yml exec backend python create_admin.py
```

The script is idempotent — re-running it resets the password back to
`admin123` and re-promotes the account.

To grant admin to an account that has registered + verified email:

```bash
# Local venv:
python make_admin.py <email>

# Docker:
docker compose -f docker-compose.dev.yml exec backend python make_admin.py <email>

# To demote later:
python make_admin.py <email> --demote
```

After running `alter_db.py`, the script tries to auto-promote the project
owner's email (see `BOOTSTRAP_ADMIN_EMAIL` in `alter_db.py`); change that
constant if your owner email differs. Once you are admin, the **Admin** link
appears in the sidebar (with a shield icon).
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

Paper Trail uses a **Dual-Project Deployment** strategy on Vercel to handle the React frontend and FastAPI backend separately.

### 1. Deploy the Backend
- **Root Directory**: `backend`
- **Framework Preset**: FastAPI
- **Environment Variables**: Add **all** variables from your `.env` file:

| Variable | Where to find it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Transaction Pooler |
| `DATABASE_URL_SYNC` | Same as above (without `+asyncpg`) |
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` |
| `DEBUG` | `False` |
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `SUPABASE_STORAGE_BUCKET` | Name of your storage bucket (e.g. `AID_DOC`) |

> ⚠️ **Skip `UPLOAD_DIR`** on Vercel — the filesystem is read-only. Files must go directly to Supabase Storage.

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

## 🐳 Docker Setup

Docker lets you run the **Frontend + Backend** with a single command. The database is hosted on Supabase — no local PostgreSQL container is needed.

### 1. Prerequisites
- **Docker Desktop** installed and running.
- A populated `backend/.env` file (see [Backend Setup](#3-backend-setup) above).

### 2. How it works
- **Hot Reloading (Dev)**: `docker-compose.dev.yml` uses **Volumes** to sync local code into the container instantly.
- **Nginx (Prod)**: The production compose file serves the frontend via Nginx — faster than Vite dev server and handles SPA routing.

### 3. Choose your mode

#### **Option A: Development Mode (Hot Reload)**
Edits in your editor reflect instantly in the browser.
- **Frontend**: [http://localhost:5173](http://localhost:5173) (Vite Dev Server)
- **Backend**: [http://localhost:8000](http://localhost:8000)

```bash
docker-compose -f docker-compose.dev.yml up --build
```

#### **Option B: Production Mode**
Mirrors the real-world deployment. You must rebuild when code changes.
- **Frontend**: [http://localhost:3000](http://localhost:3000) (Nginx)
- **Backend**: [http://localhost:8000](http://localhost:8000)

```bash
docker-compose up --build
```

### 4. Common Commands

```bash
# Stop development stack
docker-compose -f docker-compose.dev.yml down

# Stop production stack
docker-compose down

# Rebuild after adding new packages
docker-compose up --build
```

---

## 🛠️ Troubleshooting

- **CORS Errors**: If you see "Failed to fetch," check that your backend's `main.py` allows your frontend domain.
- **Database Connection**: Ensure your `DATABASE_URL` uses `+asyncpg` for the async SQLAlchemy driver, and `DATABASE_URL_SYNC` without it (for Alembic migrations).
- **Vercel Build Fails**: Double-check that your **Root Directory** is set correctly in Vercel project settings.
- **Docker Build Fails**: If you add new packages, run `docker-compose up --build` to reinstall them inside the container.
- **File Uploads Fail on Vercel**: Vercel's filesystem is read-only. Ensure all file upload logic writes to **Supabase Storage**, not the local disk.

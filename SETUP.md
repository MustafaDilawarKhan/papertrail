# Project Setup Guide

This guide covers how to set up **Paper Trail** for local development and how to deploy it to production using Vercel.

---

## 💻 Local Setup

> ### ⚡ Quickstart — recommended
>
> If you have Docker Desktop installed and a populated `backend/.env` (see
> below), you can skip the manual venv / npm install steps entirely.
>
> **With `make` (Git Bash on Windows, WSL, macOS, Linux):**
>
> ```bash
> make dev
> ```
>
> **Without `make` (plain PowerShell / cmd):**
>
> ```bash
> docker compose -f docker-compose.dev.yml up
> ```
>
> Either command:
>
> 1. Builds the backend image from `backend/Dockerfile` (~90 s first time, cached after).
> 2. Pulls `node:18-alpine` for the frontend (one-time).
> 3. Runs the one-shot `migrate` service to apply any pending schema changes.
> 4. Starts the backend on `:8000` with `uvicorn --reload` (Python hot-reload).
> 5. Starts the frontend on `:5173` with Vite HMR (React state preserved on save).
>
> Open `http://localhost:5173`. Stop with `Ctrl+C`, clean up containers
> with `make down` (or `docker compose -f docker-compose.dev.yml down`).
>
> All available `make` targets are listed by running `make` with no
> arguments — see [Make targets](#-make-targets) below, or read
> [Makefile](Makefile) directly.
>
> Skip ahead to the [Docker Setup](#-docker-setup) section for the full
> compose deep-dive, or read the manual sections below if you'd rather run
> Python and Node directly on the host.

### 1. Prerequisites
- **Node.js** (v18+) — only needed for the manual frontend path; the Docker quickstart pulls its own
- **Python** (3.9+) — only needed for the manual backend path
- **Docker Desktop** — required for the quickstart, optional otherwise
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

# Tail backend logs without restarting
docker compose -f docker-compose.dev.yml logs -f backend

# Open a shell inside the backend container (e.g. to run `python make_admin.py …`)
docker compose -f docker-compose.dev.yml exec backend bash
```

---

## 📋 Make targets

The repo ships a [`Makefile`](Makefile) with shortcuts for everything in
this guide. Works in Git Bash, WSL, macOS, and Linux. On native Windows
without `make` installed, run `winget install GnuWin32.Make` or paste the
underlying `docker compose …` commands straight from the Makefile.

Run `make` with no arguments to print the help table. Most-used targets:

| Target | Equivalent | When to use it |
| ------ | ---------- | -------------- |
| `make dev` | `docker compose -f docker-compose.dev.yml up` | Everyday — start the dev stack with hot reload. |
| `make dev-build` | `… up --build` | After changing `requirements.txt` or `package.json`. |
| `make dev-rebuild` | `build --no-cache && up` | Force a clean image rebuild (~5 min). Use sparingly. |
| `make down` | `… down` | Stop and remove dev containers. |
| `make logs` | `… logs -f` | Tail all three services' logs. |
| `make logs-backend` | `… logs -f backend` | Tail just the FastAPI server logs. |
| `make logs-frontend` | `… logs -f frontend` | Tail just the Vite dev server logs. |
| `make migrate` | `… run --rm migrate` | Manually re-run `alter_db.py`. Auto-runs on every `make dev`, so rarely needed. |
| `make shell-backend` | `… exec backend bash` | Drop into the backend container to run scripts like `python make_admin.py <email>`. |
| `make ps` | `… ps` | Show which containers are currently running. |
| `make prune` | `docker system prune -af` | Free disk space — drops unused Docker images / build cache. |
| `make prod` | `docker compose -f docker-compose.yml up` | Start the production-like stack (Nginx + immutable images). |
| `make prod-build` | `… up --build` | Rebuild + start the production stack. |

The Makefile is the canonical source of these commands — every shortcut
in this table reads directly from `Makefile` so the two never drift.

---

## 🧪 Tests

### Selenium end-to-end suite (18 tests)

The Selenium suite covers auth, navigation, and responsive layout at five
viewports. It expects the dev stack to be running on `localhost:5173`
(frontend) + `localhost:8000` (backend).

```bash
# 1. Start the dev stack in one terminal
docker compose -f docker-compose.dev.yml up

# 2. In a second terminal, run the suite headless
cd backend
./venv/Scripts/python.exe -m pytest report/test-cases/selenium/ -v
# (on macOS/Linux: ./venv/bin/python -m pytest …)
```

Run a single test (faster while iterating):

```bash
python -m pytest report/test-cases/selenium/test_landing.py::TestLandingPage::test_hero_headline_visible -v
```

Show the browser instead of running headless (great for debugging a
failing test):

```bash
SELENIUM_HEADLESS=0 python -m pytest report/test-cases/selenium/ -v
```

### Continuous Integration

Every push to `main` and every pull request automatically runs the same
suite on GitHub Actions — see [.github/workflows/selenium.yml](.github/workflows/selenium.yml).
The workflow spins up its own Postgres service, starts the backend +
frontend, runs the 18 tests headless, and uploads the pytest log,
screenshots, and (on failure) backend / frontend logs as downloadable
artefacts. Check the **Actions** tab on GitHub to see the run status.

---

## 🛠️ Troubleshooting

### General
- **CORS Errors**: If you see "Failed to fetch," check that your backend's `main.py` allows your frontend domain.
- **Database Connection**: Ensure your `DATABASE_URL` uses `+asyncpg` for the async SQLAlchemy driver, and `DATABASE_URL_SYNC` without it (for Alembic migrations).
- **Supabase project paused**: Free-tier Supabase projects auto-pause after 7 days of inactivity. The backend will fail to connect with a connection-refused error. Unpause via the Supabase dashboard.
- **Vercel Build Fails**: Double-check that your **Root Directory** is set correctly in Vercel project settings.
- **File Uploads Fail on Vercel**: Vercel's filesystem is read-only. Ensure all file upload logic writes to **Supabase Storage**, not the local disk.

### Docker Compose specifically
- **`bind: address already in use` on port 8000 or 5173**: Something else on your host is already bound to that port. Find it with `lsof -i :8000` (macOS/Linux) or `netstat -ano | findstr :8000` (Windows), then kill the offending process — or change the host-side port in `docker-compose.dev.yml`'s `ports:` mapping.
- **Hot reload doesn't pick up changes on Windows**: File-watch on bind-mounted volumes is occasionally flaky on Windows. In Docker Desktop, enable "Use the WSL 2 based engine" and put your repo inside the WSL filesystem rather than under `C:\Users\…` — performance and watching both improve sharply.
- **`npm install` takes forever on first boot**: Normal — expect 3-5 minutes. Subsequent boots reuse the anonymous `node_modules` volume and skip the install entirely. Don't `rm -rf` that volume unless you really need to refresh deps.
- **Docker Build Fails**: If you add new packages, run `docker-compose up --build` to reinstall them inside the container.
- **Backend can't read `.env`**: The `env_file:` directive needs a real `backend/.env`. The file must exist *before* you run `docker compose up`. Copy from `.env.example` if you haven't.
- **Frontend says `Failed to fetch` despite the stack running**: `frontend/.env.local` is missing or has the wrong `VITE_API_BASE_URL`. Inside Docker Compose it should be `http://localhost:8000` (set on the service environment, see `docker-compose.dev.yml`). If running the frontend natively, ensure `frontend/.env.local` exists. Vite reads env vars at startup — restart the frontend container after any change.

### Editor-specific
- **LaTeX import "skipped N commands"**: Our parser handles a sane IEEE subset. Less-common LaTeX (custom macros, `\input{...}` includes, non-IEEE author blocks) becomes plain text or is skipped. Re-export from the editor and you'll get a round-trippable `.tex` file.
- **"Recovered unsaved draft" appears unexpectedly**: The editor mirrors every keystroke to `sessionStorage` and restores it on reload if it's newer than the server copy. Clear it by closing the editor tab cleanly or with `sessionStorage.clear()` in DevTools.

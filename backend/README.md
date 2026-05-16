# Paper Trail Backend

> Python FastAPI backend for the **Paper Trail: Verifiable AI Research Assistant**.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL (Supabase) |
| Auth | JWT + bcrypt |
| Validation | Pydantic v2 |

## Quick Start

```bash
# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
# Edit .env with your Supabase connection string

# Required for bucket-based document storage
# SUPABASE_URL=https://<project-ref>.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
# SUPABASE_STORAGE_BUCKET=buccket

# 4. Start the server (auto-creates tables)
uvicorn app.main:app --reload --port 8000

# 5. Seed the database
python seed.py

# 6. Open API docs
# http://localhost:8000/docs
```

## API Endpoints

| Route | Methods | Description |
|---|---|---|
| `/api/auth/*` | POST, GET | Register, login, current user |
| `/api/users/*` | GET, PATCH | Profile & preferences |
| `/api/subscriptions/*` | GET, POST | Plans & subscriptions |
| `/api/workspaces/*` | CRUD | Collaborative workspaces |
| `/api/collections/*` | CRUD | Document folders |
| `/api/documents/*` | CRUD + Upload | File management |
| `/api/chat/*` | CRUD | Chat sessions & messages |
| `/api/annotations/*` | CRUD | Document annotations |
| `/api/citations/*` | CRUD | Formatted citations |

## Demo Account

- **Email**: `justaiuseai@gmail.com`
- **Password**: `admin123`


.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
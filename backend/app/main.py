import json
import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response

from app.database import engine, Base
from app.config import get_settings
from app.routers import (
    auth,
    users,
    workspaces,
    collections,
    documents,
    chat,
    annotations,
    citations,
    subscriptions
)
from alter_db import ensure_user_profile_columns

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def _redact_payload(raw_body: bytes) -> str:
    if not raw_body:
        return "<empty>"

    text = raw_body.decode("utf-8", errors="replace").strip()
    if not text:
        return "<empty>"

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return text

    if isinstance(data, dict):
        for key in ("password", "current_password", "new_password", "token", "access_token"):
            if key in data:
                data[key] = "***redacted***"
        return json.dumps(data, ensure_ascii=False)

    return text

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if they don't exist
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        # Note: In production, consider using Alembic for migrations instead of create_all
        await conn.run_sync(Base.metadata.create_all)
    await ensure_user_profile_columns()
    logger.info("Database tables verified.")
    yield
    # Shutdown
    logger.info("Shutting down application.")

app = FastAPI(
    title="Paper Trail API",
    description="Backend for the Paper Trail AI Research Assistant",
    version="2.0.0",
)


@app.middleware("http")
async def log_api_requests(request: Request, call_next):
    is_api_route = request.url.path.startswith("/api")
    if is_api_route:
        request_body = await request.body()
        logger.info("--> %s %s body=%s", request.method, request.url.path, _redact_payload(request_body))

    started_at = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started_at) * 1000

    if is_api_route:
        logger.info("<-- %s %s status=%s duration=%.1fms", request.method, request.url.path, response.status_code, elapsed_ms)

    return response

# CORS configuration
# Allowing the typical Vite dev server port and a possible production domain.
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(subscriptions.router, prefix="/api")
app.include_router(workspaces.router, prefix="/api")
app.include_router(collections.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(annotations.router, prefix="/api")
app.include_router(citations.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": f"Welcome to the {settings.APP_NAME}!"}

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if they don't exist
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        # Note: In production, consider using Alembic for migrations instead of create_all
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables verified.")
    yield
    # Shutdown
    logger.info("Shutting down application.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

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

"""
Aid Backend — Application Configuration
Loads environment variables from .env file using Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/aid_db"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/aid_db"

    # JWT Authentication
    SECRET_KEY: str = "aid-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # File Uploads
    UPLOAD_DIR: str = "./uploads"

    # App
    APP_NAME: str = "Aid API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

"""
Paper Trail Backend — Application Configuration
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
    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    SUPABASE_STORAGE_BUCKET: str = "buccket"
    SUPABASE_SIGNED_URL_EXPIRES_SECONDS: int = 3600

    # App
    APP_NAME: str = "Paper Trail API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # AI (OpenRouter)
    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    # Primary chat model. gpt-oss-120b:free is OpenAI's open-weight 120B MoE — a
    # safe, well-supported pick for document-grounded Q&A. Override in .env to swap.
    OPENROUTER_MODEL: str = "openai/gpt-oss-120b:free"
    # Comma-separated list of fallback model IDs (in priority order) tried when the
    # primary model returns 429 / 502 / 503 / timeout BEFORE any tokens stream out.
    # Mid-stream errors are not retried (would duplicate output to the user).
    OPENROUTER_FALLBACK_MODELS: str = "nvidia/nemotron-3-super:free,z-ai/glm-4.5-air:free"
    OPENROUTER_REFERRER: str = "https://papertrail.app"
    OPENROUTER_APP_TITLE: str = "Paper Trail"
    AI_MAX_DOC_CHARS: int = 800_000           # ~200K tokens, leaves headroom for prompt + history
    AI_MAX_HISTORY_MESSAGES: int = 10         # most recent user/assistant pairs kept per request
    AI_MAX_OUTPUT_TOKENS: int = 1500
    AI_TEMPERATURE: float = 0.1

    def model_chain(self) -> list[str]:
        """Primary model first, then any non-empty fallbacks. Deduped, order preserved."""
        chain = [self.OPENROUTER_MODEL.strip()]
        for m in self.OPENROUTER_FALLBACK_MODELS.split(","):
            m = m.strip()
            if m and m not in chain:
                chain.append(m)
        return chain

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

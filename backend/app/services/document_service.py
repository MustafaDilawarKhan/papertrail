"""
Document Service — File handling and storage management.
"""

import os
import uuid
from pathlib import Path
from urllib.parse import urlparse
import aiofiles
from fastapi import UploadFile
from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()
_supabase_client: Client | None = None

# Allowed file extensions
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".doc"}


def get_file_type(filename: str) -> str:
    """Extract file type from filename extension."""
    ext = os.path.splitext(filename)[1].lower()
    type_map = {
        ".pdf": "PDF",
        ".docx": "DOCX",
        ".doc": "DOCX",
        ".txt": "TXT",
    }
    return type_map.get(ext, "PDF")


def validate_file(filename: str) -> bool:
    """Check if the file extension is allowed."""
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


async def save_upload(file: UploadFile, user_id: str, workspace_id: str | None = None) -> tuple[str, int, bytes]:
    """
    Save an uploaded file to Supabase Storage.

    Returns (object_path, file_size_bytes, raw_content). `raw_content` is
    returned so callers (e.g. the upload router) can pipe the same bytes
    into text extraction without re-reading the upload stream.
    """
    content = await file.read()
    file_size = len(content)

    # Generate unique object path to avoid collisions
    file_ext = os.path.splitext(file.filename or "upload")[1]
    unique_name = f"{uuid.uuid4().hex}{file_ext}"
    object_path = f"{user_id}/{unique_name}" if not workspace_id else f"{user_id}/{workspace_id}/{unique_name}"

    client = get_supabase_client()
    if not client:
        raise RuntimeError(
            "Supabase storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY in backend/.env."
        )

    options = {
        "content-type": file.content_type or "application/octet-stream",
        "upsert": False,
    }
    client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(object_path, content, options)
    return object_path, file_size, content


def delete_file(storage_path: str) -> bool:
    """Delete a file from Supabase Storage or legacy local filesystem."""
    client = get_supabase_client()
    if client and not os.path.isabs(storage_path):
        try:
            client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).remove([storage_path])
            return True
        except Exception:
            pass

    try:
        if os.path.exists(storage_path):
            os.remove(storage_path)
            return True
    except OSError:
        pass
    return False


def get_view_url(storage_path: str) -> str | None:
    """Create a signed URL for a bucket object. Returns None for local files."""
    client = get_supabase_client()
    if not client:
        return None

    if os.path.isabs(storage_path):
        return None

    signed = client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).create_signed_url(
        storage_path,
        settings.SUPABASE_SIGNED_URL_EXPIRES_SECONDS,
    )
    signed_url = signed.get("signedURL") if isinstance(signed, dict) else None
    if not signed_url:
        return None

    if signed_url.startswith("http"):
        return signed_url

    if not settings.SUPABASE_URL:
        return None

    return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1{signed_url}"


def get_local_file_url(storage_path: str) -> str | None:
    """Build a file:// URL for legacy local files if they still exist."""
    path = Path(storage_path)
    if not path.is_absolute() or not path.exists():
        return None
    return path.resolve().as_uri()


def get_supabase_client() -> Client | None:
    """Create and cache Supabase client if storage credentials are configured."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    supabase_url = settings.SUPABASE_URL or infer_supabase_url_from_database_url()
    if not supabase_url or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return None

    _supabase_client = create_client(supabase_url, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client


def infer_supabase_url_from_database_url() -> str | None:
    """Infer project URL from DATABASE_URL when explicit SUPABASE_URL is not provided."""
    try:
        parsed = urlparse(settings.DATABASE_URL)
        username = parsed.username or ""
        if "." not in username:
            return None
        project_ref = username.split(".", 1)[1]
        if not project_ref:
            return None
        return f"https://{project_ref}.supabase.co"
    except Exception:
        return None

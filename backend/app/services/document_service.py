"""
Document Service — File handling and storage management.
"""

import os
import uuid
import aiofiles
from fastapi import UploadFile
from app.config import get_settings

settings = get_settings()

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


async def save_upload(file: UploadFile, user_id: str) -> tuple[str, int]:
    """
    Save an uploaded file to the local filesystem.
    Returns (storage_path, file_size).
    """
    # Create user upload directory
    upload_dir = os.path.join(settings.UPLOAD_DIR, user_id)
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename to avoid collisions
    file_ext = os.path.splitext(file.filename or "upload")[1]
    unique_name = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(upload_dir, unique_name)

    # Write file asynchronously
    content = await file.read()
    file_size = len(content)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    return file_path, file_size


def delete_file(storage_path: str) -> bool:
    """Delete a file from the local filesystem."""
    try:
        if os.path.exists(storage_path):
            os.remove(storage_path)
            return True
    except OSError:
        pass
    return False

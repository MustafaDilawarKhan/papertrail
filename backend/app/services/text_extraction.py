"""
Text extraction service.

Converts uploaded PDF / DOCX / TXT files into plain text that the
document-grounded AI chat sends to the LLM. Extraction runs on upload and
the result is stored in `documents.extracted_text`. If that column is
NULL (legacy rows, or a previous upload before this feature shipped), the
chat router can fall back to `extract_for_document` which downloads the
file from storage and re-extracts on the fly.

Heavy dependencies (pypdf, python-docx) are imported lazily so the API
still boots if a binary wheel is missing in a slim container.
"""

from __future__ import annotations

import io
import logging
import os
from typing import Iterable

from app.config import get_settings
from app.services.document_service import get_supabase_client

logger = logging.getLogger(__name__)
settings = get_settings()


# ─────────────────────────── Public API ───────────────────────────


def extract_text(file_bytes: bytes, file_type: str) -> str:
    """Extract plain text from raw file bytes given a file_type label (PDF/DOCX/TXT)."""
    if not file_bytes:
        return ""
    file_type = (file_type or "").upper()
    if file_type == "PDF":
        return _extract_pdf(file_bytes)
    if file_type == "DOCX":
        return _extract_docx(file_bytes)
    if file_type == "TXT":
        return _extract_txt(file_bytes)
    logger.warning("Unknown file_type=%s; falling back to UTF-8 decode", file_type)
    return _extract_txt(file_bytes)


def extract_html(file_bytes: bytes, file_type: str) -> str | None:
    """
    Produce a rich-HTML rendering of the document for in-browser display.

    Only DOCX is currently supported (via mammoth) — PDFs are rendered by the
    react-pdf canvas viewer and TXTs are shown as plain text, so returning None
    for those file types is correct.
    """
    if not file_bytes or (file_type or "").upper() != "DOCX":
        return None
    return _extract_docx_html(file_bytes)


async def extract_for_document(document) -> str | None:
    """
    Best-effort plain-text extraction for a Document row.

    Returns the extracted text on success, None on failure. Does NOT save
    back to the database — the caller decides what to do with it.
    """
    cached = getattr(document, "extracted_text", None)
    if cached:
        return cached

    storage_path = getattr(document, "storage_path", None)
    if not storage_path:
        return None

    raw = _fetch_bytes(storage_path)
    if raw is None:
        return None

    file_type = getattr(document, "file_type", "PDF")
    return extract_text(raw, file_type)


async def extract_html_for_document(document) -> str | None:
    """
    Best-effort HTML extraction for a Document row (DOCX only).
    Returns the HTML on success, None on failure / unsupported type.
    """
    cached = getattr(document, "extracted_html", None)
    if cached:
        return cached

    file_type = getattr(document, "file_type", "").upper()
    if file_type != "DOCX":
        return None

    storage_path = getattr(document, "storage_path", None)
    if not storage_path:
        return None

    raw = _fetch_bytes(storage_path)
    if raw is None:
        return None

    return extract_html(raw, file_type)


# ─────────────────────────── Per-format helpers ───────────────────────────


def _extract_pdf(file_bytes: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        logger.error("pypdf is not installed; cannot extract PDF text")
        return ""

    text_pages: list[str] = []
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
    except Exception as exc:
        logger.warning("Could not open PDF: %s", exc)
        return ""

    for i, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text() or ""
        except Exception as exc:
            logger.warning("PDF page %d extract failed: %s", i, exc)
            page_text = ""
        # Insert a page marker so the LLM can cite "page N" deterministically.
        # Format: "[Page N]\n…content…\n"
        text_pages.append(f"[Page {i}]\n{page_text.strip()}")

    return "\n\n".join(text_pages).strip()


def _extract_docx(file_bytes: bytes) -> str:
    try:
        from docx import Document as _DocxDocument  # python-docx
    except ImportError:
        logger.error("python-docx is not installed; cannot extract DOCX text")
        return ""

    try:
        doc = _DocxDocument(io.BytesIO(file_bytes))
    except Exception as exc:
        logger.warning("Could not open DOCX: %s", exc)
        return ""

    paragraphs: list[str] = []
    for p in doc.paragraphs:
        text = (p.text or "").strip()
        if text:
            style = (p.style.name or "") if p.style else ""
            if style.startswith("Heading"):
                paragraphs.append(f"\n## {text}\n")
            else:
                paragraphs.append(text)

    # DOCX has no native page concept; emit a synthetic [Section] marker every
    # ~3000 chars so the LLM can still produce page numbers consistently with the PDF path.
    return _insert_section_markers(paragraphs)


def _extract_docx_html(file_bytes: bytes) -> str | None:
    """
    Convert a DOCX to clean HTML using mammoth. Output contains headings, lists,
    bold/italic, tables, hyperlinks — i.e. close to how Word renders it.

    Mammoth's `convert_to_html` returns a result with `.value` (the HTML) and
    `.messages` (any conversion warnings — logged but not raised, since they're
    rarely fatal). The HTML it produces is safe by construction (no scripts,
    no event handlers), but the frontend still sanitises before injection.
    """
    try:
        import mammoth
    except ImportError:
        logger.error("mammoth is not installed; cannot extract DOCX HTML")
        return None

    try:
        result = mammoth.convert_to_html(io.BytesIO(file_bytes))
    except Exception as exc:  # noqa: BLE001 — extraction must never crash upload
        logger.warning("Could not convert DOCX to HTML: %s", exc)
        return None

    for msg in (result.messages or [])[:5]:
        logger.debug("mammoth conversion message: %s", getattr(msg, "message", msg))

    html = result.value or ""
    return html or None


def _extract_txt(file_bytes: bytes) -> str:
    for encoding in ("utf-8", "utf-16", "latin-1"):
        try:
            return file_bytes.decode(encoding).strip()
        except UnicodeDecodeError:
            continue
    return file_bytes.decode("utf-8", errors="replace").strip()


def _insert_section_markers(paragraphs: Iterable[str], target_chars: int = 3000) -> str:
    """Glue paragraphs together and insert [Page N] every ~target_chars."""
    out: list[str] = []
    page = 1
    running = 0
    out.append(f"[Page {page}]")
    for para in paragraphs:
        out.append(para)
        running += len(para)
        if running >= target_chars:
            page += 1
            out.append(f"\n[Page {page}]")
            running = 0
    return "\n".join(out).strip()


# ─────────────────────────── Storage fetch ───────────────────────────


def _fetch_bytes(storage_path: str) -> bytes | None:
    """Pull the raw file from Supabase Storage, or read local fallback."""
    # Local legacy path?
    if os.path.isabs(storage_path) and os.path.exists(storage_path):
        try:
            with open(storage_path, "rb") as fh:
                return fh.read()
        except OSError as exc:
            logger.warning("Local file read failed: %s", exc)
            return None

    client = get_supabase_client()
    if not client:
        logger.warning("No Supabase client; cannot fetch %s", storage_path)
        return None

    try:
        response = client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).download(storage_path)
    except Exception as exc:
        logger.warning("Supabase download failed for %s: %s", storage_path, exc)
        return None

    # supabase-py returns bytes directly on success
    if isinstance(response, (bytes, bytearray)):
        return bytes(response)
    return None

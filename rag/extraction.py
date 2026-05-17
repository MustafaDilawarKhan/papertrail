"""
Document → plain text with page markers.

The output text contains inline `[Page N]` markers at every page boundary.
Downstream the chunker preserves these markers so each chunk carries a
page number — that's what makes the citation→highlight loop in the
frontend work (you can scroll the PDF to the exact page).

Supported formats: PDF (.pdf), DOCX (.docx), plain text (.txt).
"""

from __future__ import annotations

from pathlib import Path


def _extract_pdf(path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    parts: list[str] = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        parts.append(f"[Page {i}]\n{text.strip()}")
    return "\n\n".join(parts)


def _extract_docx(path: Path) -> str:
    from docx import Document  # python-docx

    doc = Document(str(path))
    # python-docx doesn't expose hard page breaks reliably, so we treat
    # the whole doc as page 1 by default. (Pagination in Word is layout-
    # driven and not stored in the .docx XML in a usable way.) If you
    # need true pagination, render to PDF first and re-ingest.
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "[Page 1]\n" + "\n\n".join(paragraphs)


def _extract_txt(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    return "[Page 1]\n" + text


_EXTRACTORS = {
    ".pdf":  _extract_pdf,
    ".docx": _extract_docx,
    ".txt":  _extract_txt,
    ".md":   _extract_txt,  # markdown is just plain text for our purposes
}


def extract_text(path: str | Path) -> str:
    """Extract text + page markers from a supported document."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(p)
    suffix = p.suffix.lower()
    if suffix not in _EXTRACTORS:
        raise ValueError(
            f"Unsupported file type {suffix!r}. Supported: {', '.join(_EXTRACTORS)}"
        )
    return _EXTRACTORS[suffix](p)


def page_for_offset(text: str, char_offset: int) -> int:
    """
    Walk back from `char_offset` looking for the last `[Page N]` marker;
    return that N. Used by the chunker so every chunk knows which page
    it came from, even when it straddles a boundary.
    """
    import re

    head = text[: max(0, char_offset)]
    matches = list(re.finditer(r"\[Page (\d+)\]", head))
    return int(matches[-1].group(1)) if matches else 1

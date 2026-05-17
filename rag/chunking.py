"""
Token-aware sliding-window chunker.

Why not "split on paragraph"? Research-paper paragraphs vary from one
sentence to half a page, which produces wildly different embedding
qualities. A fixed token budget (with overlap to preserve cross-boundary
context) gives the retriever stable input.

Each chunk records:
  - text:        the chunk content (with `[Page N]` markers stripped)
  - chunk_index: position in the document
  - start_char / end_char: offsets in the original text (for highlighting)
  - page_number: the page the chunk *starts* on
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from rag import config
from rag.extraction import page_for_offset


@dataclass(slots=True)
class Chunk:
    text: str
    chunk_index: int
    start_char: int
    end_char: int
    page_number: int


_PAGE_MARKER_RE = re.compile(r"\[Page \d+\]\s*")


def _clean_chunk_text(raw: str) -> str:
    """Strip `[Page N]` sentinels but keep meaningful whitespace."""
    return _PAGE_MARKER_RE.sub("", raw).strip()


def chunk_text(text: str) -> list[Chunk]:
    """
    Tokenise the document, then slide a `CHUNK_TOKENS`-sized window over
    it with `CHUNK_OVERLAP_TOKENS` of overlap. Decoded chunks are mapped
    back to character offsets in the source string so we can record
    `start_char` / `end_char` for downstream highlighting.
    """
    import tiktoken

    enc = tiktoken.get_encoding(config.TIKTOKEN_ENCODING)
    token_ids = enc.encode(text)

    if not token_ids:
        return []

    chunks: list[Chunk] = []
    step = max(1, config.CHUNK_TOKENS - config.CHUNK_OVERLAP_TOKENS)
    cursor_char = 0  # walks forward through `text` so offsets are O(n) total

    for i, start in enumerate(range(0, len(token_ids), step)):
        end = min(start + config.CHUNK_TOKENS, len(token_ids))
        slice_text = enc.decode(token_ids[start:end])
        cleaned = _clean_chunk_text(slice_text)
        if not cleaned:
            continue

        # Find this chunk's position in the original string. We search
        # forward from `cursor_char` to avoid quadratic scans on repeated
        # phrases (papers contain a lot of repetition).
        probe = cleaned[:60]
        match_at = text.find(probe, cursor_char)
        if match_at < 0:
            # Fall back to a global search; tokeniser idiosyncrasies can
            # mean the decoded text starts with normalised whitespace.
            match_at = text.find(probe)
            if match_at < 0:
                match_at = cursor_char  # last resort, keep going

        start_char = match_at
        end_char = start_char + len(cleaned)
        cursor_char = max(cursor_char, start_char + step)

        chunks.append(Chunk(
            text=cleaned,
            chunk_index=i,
            start_char=start_char,
            end_char=end_char,
            page_number=page_for_offset(text, start_char),
        ))

        if end >= len(token_ids):
            break

    return chunks

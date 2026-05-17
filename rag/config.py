"""
Configuration for the RAG reference implementation.

All paths, model names, and tuning knobs in one place so the rest of
the module reads cleanly. Override any of these via environment
variables (prefix `RAG_`) without editing this file.
"""

from __future__ import annotations

import os
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────
RAG_ROOT = Path(__file__).resolve().parent
PERSIST_DIR = Path(os.getenv("RAG_PERSIST_DIR", str(RAG_ROOT / ".chroma_db")))
SAMPLES_DIR = RAG_ROOT / "samples"

# ─── Embedding model ──────────────────────────────────────────────────────
# 384-dimensional, ~80 MB, runs on CPU in milliseconds per chunk.
# Chosen for the zero-budget constraint — no API calls, ever.
EMBEDDING_MODEL = os.getenv("RAG_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# ─── Chunking ─────────────────────────────────────────────────────────────
# Token-aware sliding window. 512 tokens × ~0.75 words/token ≈ 380 words —
# big enough to hold a paragraph of a research paper, small enough that the
# retrieval is precise. Overlap preserves context across boundaries
# (claims that span a paragraph break still embed coherently).
CHUNK_TOKENS = int(os.getenv("RAG_CHUNK_TOKENS", "512"))
CHUNK_OVERLAP_TOKENS = int(os.getenv("RAG_CHUNK_OVERLAP_TOKENS", "64"))

# Tokeniser used purely for counting (not for embedding). cl100k_base
# matches gpt-3.5/4 tokenization which is a sensible neutral default.
TIKTOKEN_ENCODING = os.getenv("RAG_TIKTOKEN_ENCODING", "cl100k_base")

# ─── Retrieval ────────────────────────────────────────────────────────────
DEFAULT_TOP_K = int(os.getenv("RAG_TOP_K", "5"))

# Below this cosine similarity we don't bother sending the chunk to the
# LLM — retrieval noise rather than signal. Empirical default; tune per
# corpus.
MIN_SIMILARITY = float(os.getenv("RAG_MIN_SIMILARITY", "0.20"))

# ─── LLM (optional — used by `ask()` not by retrieval) ────────────────────
# OpenRouter is OpenAI-API-compatible. Set `OPENROUTER_API_KEY` in env to
# enable answer generation; otherwise `ask()` returns the retrieved
# chunks without a synthesised answer.
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Free-tier OpenRouter model — change in env if rate-limited.
LLM_MODEL = os.getenv("RAG_LLM_MODEL", "openai/gpt-oss-120b:free")
LLM_TEMPERATURE = float(os.getenv("RAG_LLM_TEMPERATURE", "0.2"))
LLM_MAX_TOKENS = int(os.getenv("RAG_LLM_MAX_TOKENS", "800"))

# ─── Collection ───────────────────────────────────────────────────────────
COLLECTION_NAME = os.getenv("RAG_COLLECTION_NAME", "papertrail_chunks")

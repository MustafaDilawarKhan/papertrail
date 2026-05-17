"""
Smoke test — ingest the sample doc, retrieve a passage, verify the
pipeline returns something sensible. Skipped if heavy deps aren't
installed (sentence-transformers, chromadb), so the rest of the
project's test runs aren't gated on the RAG model download.

Run:
    cd <repo root>
    python -m pip install -r rag/requirements.txt
    python -m pytest rag/tests/
"""

from __future__ import annotations

import importlib
import shutil

import pytest

from rag import config


pytestmark = pytest.mark.skipif(
    importlib.util.find_spec("sentence_transformers") is None
    or importlib.util.find_spec("chromadb") is None,
    reason="RAG deps not installed — `pip install -r rag/requirements.txt` to enable.",
)


@pytest.fixture(autouse=True)
def _isolated_store(tmp_path, monkeypatch):
    """Point the vector store at a throwaway dir per test."""
    monkeypatch.setattr(config, "PERSIST_DIR", tmp_path / "chroma")
    yield
    shutil.rmtree(tmp_path / "chroma", ignore_errors=True)


def test_ingest_and_retrieve_sample():
    from rag import pipeline, vector_store

    doc_id = pipeline.ingest_document(config.SAMPLES_DIR / "sample.txt", doc_id="smoke-doc")
    assert doc_id == "smoke-doc"

    # The store should now hold at least one chunk for this doc.
    stats = vector_store.stats()
    assert stats["count"] >= 1, "ingest produced no chunks"

    # Retrieve on a phrase from §3 of the sample. The top chunk must
    # surface the "40%" / "false-positive" result.
    passages = pipeline.retrieve("source verification false-positive rate", doc_id="smoke-doc", top_k=3)
    assert passages, "retrieval returned no passages"
    top = passages[0]
    assert "false" in top["text"].lower() or "40%" in top["text"]
    assert top["page_number"] >= 1
    assert top["score"] > config.MIN_SIMILARITY


def test_retrieve_off_topic_returns_low_score_or_empty():
    from rag import pipeline

    pipeline.ingest_document(config.SAMPLES_DIR / "sample.txt", doc_id="smoke-doc")
    passages = pipeline.retrieve("recipe for chicken biryani", doc_id="smoke-doc", top_k=3)
    # Off-topic should either return nothing (filtered by MIN_SIMILARITY)
    # or low-scoring matches. We test the contract: no passage is high-score.
    if passages:
        assert max(p["score"] for p in passages) < 0.6, \
            "off-topic query somehow scored high — embedding model misbehaving"


def test_ask_without_llm_returns_passages():
    """`ask()` should still return retrieved passages even when no LLM key is set."""
    import os

    os.environ.pop("OPENROUTER_API_KEY", None)
    # Reload config so the cleared env var takes effect.
    importlib.reload(config)
    from rag import pipeline
    importlib.reload(pipeline)

    pipeline.ingest_document(config.SAMPLES_DIR / "sample.txt", doc_id="smoke-doc")
    res = pipeline.ask("What is the effect of verification?", doc_id="smoke-doc")
    assert res.used_llm is False
    assert res.retrieved_passages, "ask() must return passages even without LLM"

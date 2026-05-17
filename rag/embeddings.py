"""
Local sentence-transformers embedding wrapper.

Lazy-loads the model on first call so importing this module is cheap.
All embeddings are L2-normalised so the vector store can use cosine
distance interchangeably with dot product.
"""

from __future__ import annotations

from functools import lru_cache

from rag import config


@lru_cache(maxsize=1)
def _model():
    """Loaded once per process. ~80 MB download on first run."""
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(config.EMBEDDING_MODEL)


def embed_query(text: str) -> list[float]:
    """Single-vector encode for retrieval-time queries."""
    if not text or not text.strip():
        raise ValueError("embed_query: text must not be empty")
    arr = _model().encode(text, normalize_embeddings=True, show_progress_bar=False)
    return arr.tolist()


def embed_documents(texts: list[str], batch_size: int = 32) -> list[list[float]]:
    """Batched encode for ingestion time. Returns one vector per input."""
    if not texts:
        return []
    arr = _model().encode(
        texts,
        batch_size=batch_size,
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True,
    )
    return arr.tolist()


def embedding_dim() -> int:
    """Useful when initialising the vector store."""
    return _model().get_sentence_embedding_dimension()

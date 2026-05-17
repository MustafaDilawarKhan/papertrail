"""
ChromaDB-backed persistent vector store.

Why Chroma:
  - Embedded (no separate server process)
  - File-based (lives at config.PERSIST_DIR, easy to delete to reset)
  - Stores vectors + metadata in one place — fits "zero-budget" cleanly

We bypass Chroma's built-in embedding function and pass embeddings in
explicitly, so the embedding model stays the only source of truth for
how text is represented. That matters: if the embedding model ever
changes, you can re-ingest without Chroma silently re-encoding with a
different default.
"""

from __future__ import annotations

from rag import config


def _client():
    import chromadb
    config.PERSIST_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(config.PERSIST_DIR))


def _collection():
    # `cosine` matches our L2-normalised embeddings.
    return _client().get_or_create_collection(
        name=config.COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


def add_chunks(
    *,
    doc_id: str,
    chunks: list[dict],
    embeddings: list[list[float]],
) -> None:
    """
    Insert (or upsert) a batch of chunks.

    Each `chunk` is a dict with keys: text, chunk_index, page_number,
    start_char, end_char. We derive a stable id `{doc_id}::{chunk_index}`
    so re-ingesting the same doc replaces rather than duplicates.
    """
    if not chunks:
        return
    col = _collection()
    ids = [f"{doc_id}::{c['chunk_index']}" for c in chunks]
    metadatas = [
        {
            "doc_id":      doc_id,
            "chunk_index": int(c["chunk_index"]),
            "page_number": int(c["page_number"]),
            "start_char":  int(c["start_char"]),
            "end_char":    int(c["end_char"]),
        }
        for c in chunks
    ]
    documents = [c["text"] for c in chunks]
    col.upsert(ids=ids, documents=documents, embeddings=embeddings, metadatas=metadatas)


def query(
    *,
    embedding: list[float],
    top_k: int = 5,
    doc_id: str | None = None,
) -> list[dict]:
    """
    Cosine-similarity search. If `doc_id` is provided we restrict to a
    single document (the common case when the user opens one paper and
    asks questions about it).

    Returns a list of `{ text, score, page_number, chunk_index, doc_id,
    start_char, end_char }` ordered by descending similarity.
    """
    col = _collection()
    where = {"doc_id": doc_id} if doc_id else None
    res = col.query(
        query_embeddings=[embedding],
        n_results=top_k,
        where=where,
    )

    out: list[dict] = []
    docs       = (res.get("documents")  or [[]])[0]
    metas      = (res.get("metadatas")  or [[]])[0]
    distances  = (res.get("distances")  or [[]])[0]

    for text, meta, dist in zip(docs, metas, distances):
        out.append({
            "text":         text,
            # Chroma returns cosine *distance* (1 - cos_sim). Convert
            # back so callers see a similarity in [0, 1].
            "score":        max(0.0, 1.0 - float(dist)),
            "page_number":  meta.get("page_number", 1),
            "chunk_index":  meta.get("chunk_index", 0),
            "doc_id":       meta.get("doc_id", ""),
            "start_char":   meta.get("start_char", 0),
            "end_char":     meta.get("end_char", 0),
        })
    return out


def delete_document(doc_id: str) -> None:
    """Remove every chunk belonging to a given doc."""
    _collection().delete(where={"doc_id": doc_id})


def stats() -> dict:
    """Quick health check — chunk count + collection name."""
    col = _collection()
    return {
        "collection": config.COLLECTION_NAME,
        "count":      col.count(),
        "persist_dir": str(config.PERSIST_DIR),
    }

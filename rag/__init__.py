"""
Paper Trail — RAG reference implementation.

Standalone module. Nothing in the main `backend/app/` codebase imports
from here. To experiment with retrieval-augmented generation against
your existing documents, follow `rag/README.md`.

Public entry points:
    from rag.pipeline import ingest_document, ask
"""

__all__ = ["ingest_document", "ask"]
__version__ = "0.1.0"

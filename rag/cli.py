"""
Tiny CLI so the RAG module is usable end-to-end from a terminal.

Examples:
    python -m rag.cli ingest rag/samples/sample.txt
    python -m rag.cli ask "What does the document say about verifiability?"
    python -m rag.cli ask "Methodology summary" --doc doc-abc123 --top-k 3
    python -m rag.cli stats
    python -m rag.cli reset --doc doc-abc123
"""

from __future__ import annotations

import argparse
import json
import sys

from rag import pipeline, vector_store


def _cmd_ingest(args) -> int:
    doc_id = pipeline.ingest_document(args.path, doc_id=args.doc)
    print(json.dumps({"ingested": args.path, "doc_id": doc_id}, indent=2))
    return 0


def _cmd_ask(args) -> int:
    response = pipeline.ask(args.question, doc_id=args.doc, top_k=args.top_k)
    print("\n──────── ANSWER ────────")
    print(response.answer)
    if response.sources:
        print("\n──────── SOURCES ───────")
        for i, s in enumerate(response.sources, start=1):
            print(f"  [{i}] page {s.page} · score {s.score:.2f} · {s.relevance}")
            print(f"      {s.excerpt[:160]}")
    print(f"\n(used_llm={response.used_llm}, retrieved={len(response.retrieved_passages)} passages)")
    return 0


def _cmd_stats(args) -> int:
    print(json.dumps(vector_store.stats(), indent=2))
    return 0


def _cmd_reset(args) -> int:
    if not args.doc:
        print("--doc is required for reset (refusing to wipe entire store)", file=sys.stderr)
        return 2
    vector_store.delete_document(args.doc)
    print(json.dumps({"deleted_doc": args.doc}, indent=2))
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="python -m rag.cli", description="Paper Trail RAG reference CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    p_ingest = sub.add_parser("ingest", help="Ingest a PDF/DOCX/TXT into the vector store")
    p_ingest.add_argument("path")
    p_ingest.add_argument("--doc", help="Optional pre-set doc_id (default: random)")
    p_ingest.set_defaults(func=_cmd_ingest)

    p_ask = sub.add_parser("ask", help="Ask a question against ingested docs")
    p_ask.add_argument("question")
    p_ask.add_argument("--doc",   help="Restrict retrieval to a single doc_id")
    p_ask.add_argument("--top-k", type=int, default=None)
    p_ask.set_defaults(func=_cmd_ask)

    p_stats = sub.add_parser("stats", help="Vector store stats")
    p_stats.set_defaults(func=_cmd_stats)

    p_reset = sub.add_parser("reset", help="Delete all chunks for one doc_id")
    p_reset.add_argument("--doc", required=True)
    p_reset.set_defaults(func=_cmd_reset)

    args = p.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())

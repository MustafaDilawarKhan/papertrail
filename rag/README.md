# Paper Trail — RAG reference implementation

A standalone retrieval-augmented generation module designed to match the
shape of the existing Paper Trail chat (document-grounded answers with
inline `[N]` citations and verbatim excerpts for passage highlighting).

> **This folder is not wired into the main app.** Nothing under
> `backend/app/` imports from `rag/`. It exists as a working reference
> you can opt-in to integrate later when you want to upgrade the chat
> pipeline from "full document in context" to "retrieve top-k chunks".

---

## Why this exists

The current chat pipeline pastes the **entire** extracted document into
the LLM's context window and relies on the model's attention to find
relevant spans. That works well for short-to-medium papers but has two
limits:

1. **Context cap.** Very long papers (or a multi-doc workspace) won't
   fit. Today's code truncates with a warning — you lose information.
2. **Cost / latency.** Big-context calls are slower and more expensive
   than retrieving 1–2 KB of relevant text and sending that.

A retrieval step solves both. The trade-off: you have to maintain a
vector index, and retrieval can miss spans that don't lexically resemble
the query. This module is the minimal honest RAG that fits Paper Trail.

---

## Architecture

```
              ingestion (one-time per doc)              query time
              ─────────────────────────────             ─────────────
   document ──► extraction ──► chunking ──► embedding ──► chroma
                                                         │
                                                         ▼
                                                  similarity search
                                                         │
                                                         ▼
                                          top-k passages → LLM
                                                         │
                                                         ▼
                                                  answer + sources
                                                  (same shape as the
                                                   main app's chat)
```

| Step          | Implementation             | Model / library                          |
| ------------- | -------------------------- | ---------------------------------------- |
| Extraction    | `rag/extraction.py`        | `pypdf`, `python-docx` (already in main) |
| Chunking      | `rag/chunking.py`          | `tiktoken` (cl100k_base), 512 / 64 over. |
| Embedding     | `rag/embeddings.py`        | `sentence-transformers/all-MiniLM-L6-v2` |
| Vector store  | `rag/vector_store.py`      | `chromadb` (embedded, file-based)        |
| Prompt        | `rag/prompt.py`            | Mirrors main app's citation contract     |
| Orchestration | `rag/pipeline.py`          | Pure-Python glue                         |
| CLI           | `rag/cli.py`               | `argparse`                               |

### Zero-budget choices

* **Embeddings run locally** (sentence-transformers, ~80 MB on first
  call, CPU-only is fine). No OpenAI/Cohere/Voyage API costs.
* **Vector store is file-based** (ChromaDB persists to
  `rag/.chroma_db/`). No managed Pinecone/Weaviate.
* **Generation uses OpenRouter `*:free` models** (the same provider the
  main app already uses). If `OPENROUTER_API_KEY` is unset, `ask()`
  returns the retrieved chunks without calling an LLM — fully usable
  for retrieval-only testing.

---

## Setup

```bash
# from the repo root
python -m pip install -r rag/requirements.txt
```

First run will download `all-MiniLM-L6-v2` (~80 MB). After that, no
network calls during retrieval.

To enable answer generation:

```bash
# Optional — only if you want `ask()` to synthesise answers
export OPENROUTER_API_KEY=sk-or-...
```

---

## Usage

### CLI

```bash
# 1. Ingest a document. doc_id is returned and re-used as a handle.
python -m rag.cli ingest rag/samples/sample.txt

# {
#   "ingested": "rag/samples/sample.txt",
#   "doc_id":  "doc-3f1a8c5e2d40"
# }

# 2. Ask a question (against all ingested docs)
python -m rag.cli ask "What was the false-positive reduction?"

# 3. Or restrict to one doc and pick a custom top-k
python -m rag.cli ask "methodology" --doc doc-3f1a8c5e2d40 --top-k 3

# 4. Quick health check
python -m rag.cli stats

# 5. Wipe a doc's chunks
python -m rag.cli reset --doc doc-3f1a8c5e2d40
```

### Python API

```python
from rag.pipeline import ingest_document, ask, retrieve

doc_id = ingest_document("path/to/paper.pdf")

# Retrieval-only (no LLM call, useful for tests/debugging)
hits = retrieve("methodology", doc_id=doc_id, top_k=5)
for h in hits:
    print(f"p{h['page_number']}  score={h['score']:.2f}  {h['text'][:80]}")

# Full answer
response = ask("Summarise the methodology section", doc_id=doc_id)
print(response.answer)
for s in response.sources:
    print(f"  [page {s.page}] {s.excerpt}")
```

The `AnswerResponse` shape (answer string + `sources: [{page, section,
excerpt, relevance, score}]`) is intentionally the same as what the
main app's chat API returns, so the frontend highlighter would not
need changes.

---

## How it differs from the current chat pipeline

| Aspect              | Main app today                                   | This RAG module                                     |
| ------------------- | ------------------------------------------------ | --------------------------------------------------- |
| Document handling   | Whole extracted text into the prompt             | Chunked, embedded, retrieved top-k                  |
| Context size        | Capped by `AI_MAX_DOC_CHARS`, truncates if over  | Independent of document size                        |
| Multi-doc           | One doc per chat session                         | Cross-doc retrieval by removing `doc_id` filter     |
| Similarity score    | Hardcoded 1.0 / 0.7 in `SourceHighlight`         | Real cosine similarity from embeddings              |
| Highlighting        | Verbatim-excerpt search in PDF text layer / HTML | Same — preserved by the prompt + source-block shape |
| External deps       | OpenRouter only                                  | + sentence-transformers, chromadb, tiktoken         |

---

## How to integrate later (NOT done yet)

When you want to swap the main app's chat over to use this module,
roughly three things change in `backend/app/routers/chat.py`:

1. **Ingestion hook** — on document upload (after text extraction),
   call `rag.pipeline.ingest_document(path, doc_id=str(document.document_id))`.
   Today text extraction lives in
   `backend/app/services/text_extraction.py`; you'd call `ingest_document`
   from `documents.py` after the extracted text is saved.

2. **Swap the prompt context** — in `_build_api_messages`
   ([chat.py:405-413](../backend/app/routers/chat.py)) replace the
   "here is the whole document" user message with a call to
   `rag.pipeline.retrieve(user_question, doc_id=str(document.document_id))`,
   then format the passages via `rag.prompt.format_passages` and inject
   that instead.

3. **Use the real similarity** — in `_persist_assistant_message`
   ([chat.py:354-365](../backend/app/routers/chat.py)) the
   `similarity_score` field is hardcoded to `1.0` / `0.7`. After
   retrieval, you have a real cosine score per passage; pipe it through
   so admin/analytics get truthful numbers.

The frontend never needs to change — the citation `[N]` marker + source
block contract is preserved end-to-end.

---

## Tests

```bash
python -m pytest rag/tests/ -v
```

The smoke tests skip themselves when `sentence-transformers` / `chromadb`
aren't installed, so the main project's tests aren't gated on the RAG
model download.

---

## Tuning knobs

All exposed via env vars (prefix `RAG_`). See [config.py](config.py)
for the full list. The defaults are deliberately conservative; the
ones most likely to matter are:

* `RAG_CHUNK_TOKENS` (default 512) — bigger chunks = fewer, more-context
  retrievals; smaller = more precise, more chunks per doc.
* `RAG_TOP_K` (default 5) — how many chunks to feed the LLM. Bigger = more
  context, more cost.
* `RAG_MIN_SIMILARITY` (default 0.20) — drop chunks below this cosine
  similarity. Raise it to suppress noise; lower it to be more forgiving
  on off-topic queries.

---

## Files

```
rag/
├── README.md          ← this file
├── __init__.py
├── config.py          ← paths, model names, tuning knobs
├── extraction.py      ← PDF/DOCX/TXT → text with [Page N] markers
├── chunking.py        ← token-aware sliding-window chunks
├── embeddings.py      ← local sentence-transformers wrapper
├── vector_store.py    ← ChromaDB persistent client
├── prompt.py          ← RAG system prompt + passage formatter
├── pipeline.py        ← ingest / retrieve / ask (top-level API)
├── cli.py             ← `python -m rag.cli ingest|ask|stats|reset`
├── requirements.txt
├── samples/
│   └── sample.txt     ← tiny doc for smoke testing
└── tests/
    └── test_smoke.py  ← ingest + retrieve + ask without LLM
```

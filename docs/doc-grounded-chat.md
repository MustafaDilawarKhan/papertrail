# Document-Grounded AI Chat

> Live since 2026-05-16. Replaces the previous stub `POST /chat/sessions/{id}/messages` that returned a hard-coded placeholder.

This document describes how Paper Trail's AI chat answers questions about an uploaded document. Read this if you're maintaining the feature, debugging a bad answer, or adding a new model.

---

## What it is (in one paragraph)

When a user opens a document and asks a question, the **entire extracted text of that document** is sent to a free chat model on OpenRouter, wrapped in a system prompt that forbids any knowledge outside the document. The model writes its answer with **inline `[1]` `[2]` markers** at the points it's quoting, then ends with a hidden ` ```source ` JSON block giving the page + section + verbatim excerpt for each marker. The backend strips that block before the user sees it, persists the markers + excerpts as `SourceHighlight` rows, and the frontend renders the markers as clickable green badges. Clicking a badge scrolls the document pane to the cited page and highlights the exact passage.

No RAG. No vector database. No embeddings. The intelligence is **the system prompt** plus a free chat model with a long enough context window.

---

## End-to-end flow

```
┌─────────────────┐                             ┌────────────────────┐
│  User asks a    │                             │   OpenRouter API   │
│  question in    │                             │ (gpt-oss-120b:free │
│  DocViewerPage  │                             │  with fallbacks)   │
└────────┬────────┘                             └──────────▲─────────┘
         │                                                 │
         │ 1. POST /chat/sessions                          │
         │ 2. POST /chat/sessions/{id}/messages/stream     │
         ▼                                                 │
┌────────────────────────┐    3. Build messages:           │
│  FastAPI chat router   │       [system,                  │
│  (app/routers/chat.py) ├──▶    user(doc_text),           │
│                        │       assistant(ack),           │
│                        │       ...history,               │
│                        │       user(question)]           │
└────────┬───────────────┘                                 │
         │ 4. stream_chat_completion(messages) ─────────────
         │                                                 │
         │ 5. Tokens stream back, stripped of              │
         │    ```source block on the fly                  │
         │ 6. Final source block parsed →                  │
         │    SourceHighlight rows persisted               │
         ▼
┌────────────────────────┐
│  SSE → frontend        │
│  data: {delta}         │
│  data: {delta}         │
│  ...                   │
│  data: {done, sources} │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│  DocViewerPage renders:                                    │
│  - text streamed into message bubble                       │
│  - [1] / [2] in text → numbered green badges               │
│  - click badge → setActiveSource(src)                      │
│    → PDF iframe gets #page=N                               │
│    → TextDocumentView (DOCX/TXT) scrolls + highlights excerpt│
└────────────────────────────────────────────────────────────┘
```

---

## The two endpoints

| Route | Purpose | Used by |
|---|---|---|
| `POST /api/chat/sessions` | Create a chat session bound to a document (`context_type=document`, `context_id=<doc_id>`) | Frontend, on the first message of a conversation |
| `POST /api/chat/sessions/{id}/messages/stream` | Send a user message, get the assistant reply streamed as SSE | Frontend chat panel |
| `POST /api/chat/sessions/{id}/messages` | Non-streaming variant returning a single JSON `MessageResponse` | Curl debugging, batch flows |
| `GET /api/chat/sessions/{id}` | Returns the session with all prior messages **and their persisted source highlights** | Frontend, on page reload (rehydrates the chat) |
| `GET /api/documents/{id}/text` | Returns the server-extracted plain text of a document | Frontend `TextDocumentView` (DOCX) |

### SSE event format

The streaming endpoint emits one line per event:

```
data: {"type": "delta", "content": "The "}
data: {"type": "delta", "content": "Transformer "}
data: {"type": "delta", "content": "uses self-attention [1]."}
data: {"type": "done", "message_id": "9f3b…", "sources": [{...}, {...}]}
```

If the model is rate-limited or unavailable **before** the first token, the backend automatically falls back to the next configured model. If a mid-stream error happens, the frontend gets:

```
data: {"type": "error", "error": "AI provider error. Try again."}
```

---

## The system prompt

Lives at [`backend/app/services/document_prompt.py`](../backend/app/services/document_prompt.py). It's the **single most important file** in this feature. The exact ruleset:

1. **Answer only from the document.** No outside knowledge, no training-data facts.
2. **Out-of-scope → fixed reply.** If the question has no connection to the doc, return exactly `"I could not find anything like that in the document."` (no [N] markers, no source block).
3. **Partial match.** If the doc covers an adjacent topic, answer with it and say so explicitly.
4. **Inline `[N]` citations** at the supported claim. `[1]` → first source in array, `[2]` → second, etc.
5. **Append a ` ```source ` JSON block** at the end with `page`, `section`, `excerpt`, `relevance` for each `[N]`.
6. **Response style** — concise, no "Based on the document…", no parenthetical citations.

> **Do not soften the rules.** They are tuned for grounded answers + machine-parseable sources. Loosening rule 2 produces hallucinations. Loosening rule 5 breaks the highlight feature silently.

---

## How the streaming-safe source-block stripper works

The naive approach — check each streaming delta for the literal `"```source"` substring and drop matching deltas — **does not work**. Models tokenize that marker across multiple deltas. We saw the bug live: the entire JSON block leaked into the chat bubble.

The fixed implementation (in [`chat.py`](../backend/app/routers/chat.py) → `event_generator()`):

1. Maintains a `pending` string of bytes not yet forwarded.
2. On each delta: append to `pending`, then search `pending` for `"```source"`.
3. If found: forward only the prose **before** the marker, switch to "swallow mode", and discard everything after.
4. If not found yet: forward `pending` minus the last `len("```source") = 10` chars (those 10 might still be the start of the marker — keep them buffered).
5. When the stream ends without ever seeing the marker, flush whatever's left in `pending`.

This guarantees the user never sees ` ```source ` even if the model splits it across 9 deltas.

Smoke tests live in the commit history — search the chat for "smoke-test the streaming-safe source block stripper".

---

## Document text extraction

| File type | Path | Library | Page markers |
|---|---|---|---|
| PDF | `app/services/text_extraction.py` → `_extract_pdf` | `pypdf` | Real page numbers, `[Page 1]` … `[Page N]` |
| DOCX | `_extract_docx` | `python-docx` | Synthetic — `[Page N]` inserted every ~3000 chars (DOCX has no real page concept) |
| TXT | `_extract_txt` | stdlib | Plain UTF-8 decode (with utf-16 / latin-1 fallbacks) |

Why the `[Page N]` annotations? **The model cites pages by reading them.** Without these markers, the model has no idea what page anything is on and either hallucinates page numbers or skips the field. With them, page numbers come back correctly nearly every time.

**Extraction runs at upload time** (in `routers/documents.py`) and the result is stored in the new column `documents.extracted_text`. For documents uploaded before this feature shipped (`extracted_text IS NULL`), the chat router **lazily extracts on first question**: downloads the file from Supabase Storage, runs extraction, writes back to the column. The user sees a 3-10 s delay on that first request; subsequent ones are instant.

---

## The `SourceHighlight` model

Defined in [`backend/app/models/source_highlight.py`](../backend/app/models/source_highlight.py). One row per `[N]` marker per assistant message. Schema:

| Column | Meaning |
|---|---|
| `highlight_id` | UUID, primary key |
| `message_id` | FK → `chat_messages.message_id` (cascade delete) |
| `document_id` | FK → `documents.document_id` |
| `page_number` | The cited page (from the `[Page N]` markers) |
| `chunk_text` | The model's verbatim `excerpt` |
| `similarity_score` | `1.0` for `relevance=primary`, `0.7` for `supporting` |

These rows survive session reload, so opening an old conversation re-renders all the citation badges.

---

## Frontend rendering

### Inline `[N]` → numbered green badges

[`appPages.jsx`](../frontend/src/pages/appPages.jsx) → `renderAnswerWithCitations(content, sources, focusSource, activeSource)`.

```
"The study reduced false-positive claims by 40% [1] and improved accuracy by 28% [2]."
                                                  ↑                                ↑
                                                badge                           badge
```

Each badge is a `<button>` with:
- The number (1, 2, ...) drawn inside a small green circle.
- A tooltip showing `p.<page> · <section>` and the excerpt.
- `onClick={() => focusSource(sources[n - 1])}`.

If the model emits `[5]` but only 3 sources exist, the badge falls back to plain text `[5]` (no crash, no broken UI).

### Click handler — `focusSource(src)`

Sets `activeSource = src`. That state triggers:
- **PDFs**: the iframe's `src` becomes `…#toolbar=1&navpanes=0&page={src.page}` with a re-mount key forcing navigation even if the same page is clicked twice.
- **DOCX**: `<TextDocumentView>` highlights the matching excerpt with `<mark>` and scrolls it into view via `scrollIntoView({ block: "center" })`.
- **TXT**: same as DOCX (uses the raw text content fetched from `viewUrl`).

### Why DOCX doesn't use Microsoft's Office Online viewer anymore

The previous implementation rendered DOCX in a `<iframe src="…officeapps.live.com/op/embed.aspx…">`. That viewer is opaque — we can't scroll it, can't highlight inside it. To get **passage-level** highlighting (the user requirement), we switched to rendering the **server-extracted plain text** in our own `<TextDocumentView>`. The original-formatted version is still one click away as an "Open original ↗" link in the top-right.

---

## Configuration

Everything in `backend/.env`:

| Variable | Default | Notes |
|---|---|---|
| `OPENROUTER_API_KEY` | (required) | https://openrouter.ai/keys |
| `OPENROUTER_MODEL` | `openai/gpt-oss-120b:free` | Primary chat model |
| `OPENROUTER_FALLBACK_MODELS` | `nvidia/nemotron-3-super:free,z-ai/glm-4.5-air:free` | Comma-separated, in priority order |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | Rarely changed |
| `AI_MAX_DOC_CHARS` | `800_000` | Truncates very long documents before sending |
| `AI_MAX_HISTORY_MESSAGES` | `10` | How many prior messages travel with each request |
| `AI_MAX_OUTPUT_TOKENS` | `1500` | Cap on assistant reply length |
| `AI_TEMPERATURE` | `0.1` | Low = grounded; do not raise above ~0.3 |

The fallback chain is **only consulted before the first token streams out**. Mid-stream failures surface as user-visible errors — falling back at that point would duplicate output.

---

## Failure modes & how to diagnose

| Symptom | Probable cause | Fix |
|---|---|---|
| Chat bubble shows raw ` ```source ` JSON | Old build cached in browser, or running pre-fix code | Hard-refresh frontend; confirm `chat.py` `event_generator()` has the buffered stripper |
| `[1]` / `[2]` render as plain text instead of badges | Frontend not parsing — `renderAnswerWithCitations` not wired in | Check the JSX block in `DocViewerPage` uses that function |
| Source badges appear but click does nothing | `focusSource` not set, or PDF page=N anchor blocked by browser | DevTools → check `activeSource` state; for PDF, confirm the iframe `src` updated |
| AI says "I could not access the document text yet" | `extracted_text` is null AND the lazy extractor failed | Backend logs will show `Could not open PDF / DOCX`. Re-upload, or fix the file. |
| AI ignores the document and uses outside knowledge | Model strayed from system prompt | Lower temperature, switch to a stronger model, or strengthen rule 1 wording |
| Chat returns 502 "AI provider error" | All three configured models rejected the request | Check OpenRouter dashboard for quota; rotate the key; swap models |
| "I could not find anything like that in the document" on an obviously-covered topic | Extraction produced garbage (scanned PDF, broken DOCX) | Open the document — does the text view show real content? If not, the PDF is image-only and needs OCR (not yet implemented) |

### Useful one-liners

```bash
# What text does the AI actually see for a given doc?
curl -H "Authorization: Bearer $JWT" \
  http://localhost:8000/api/documents/<DOC_ID>/text | jq '.text' | head -c 500

# How many of my docs have extracted text yet?
docker compose -f docker-compose.dev.yml exec backend python -c "
import asyncio, os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
async def main():
    e = create_async_engine(os.getenv('DATABASE_URL'),
        connect_args={'prepared_statement_cache_size':0,'statement_cache_size':0})
    async with e.connect() as c:
        r = await c.execute(text('SELECT COUNT(*), COUNT(extracted_text) FROM documents'))
        print(r.one())
asyncio.run(main())
"
```

---

## What this feature deliberately does NOT do

To keep scope tight and the build understandable, these were explicit non-goals:

| Non-goal | Why |
|---|---|
| RAG / vector retrieval / embeddings | Free chat models have 130K+ token context windows — that's enough to fit any reasonable research paper or assignment brief in one shot. No retrieval needed. |
| Cross-document chat | The session is scoped to ONE document. A workspace-wide or collection-wide chat is straightforward to add later (concatenate texts in the user message) but not yet wired. |
| OCR for scanned PDFs | Image-only PDFs return empty extracted text. We don't have tesseract or PaddleOCR in the container. |
| True PDF passage highlighting (not just page navigation) | Would require swapping the iframe-based PDF viewer for `react-pdf` with custom text-layer overlays. The dep is installed but unused. ~200 line task. |
| Reasoning-mode tokens | Some OpenRouter models accept `reasoning: {enabled: true}` for chain-of-thought. We don't enable it — adds latency and interferes with the strict JSON output. |
| Streaming-aware source highlighting | Highlights only appear when the `done` event lands. We could parse partial JSON to show provisional badges sooner, but it's brittle and the latency gain is minimal. |

---

## Migration checklist

If you've changed schema or system-prompt rules:

- [ ] Update `backend/alter_db.py` with idempotent `ADD COLUMN IF NOT EXISTS` for any new columns
- [ ] Test on a fresh checkout: `make down && make dev` — the `migrate` service should run cleanly
- [ ] Bump the prompt date comment if behaviour changes (helps reviewers spot it in PRs)
- [ ] Re-test out-of-scope handling (rule 2) — the exact-phrase rejection is fragile to prompt edits

---

## Files touched by this feature

```
backend/
├── app/
│   ├── config.py                            ← OPENROUTER_* settings + model_chain()
│   ├── models/
│   │   └── document.py                      ← new extracted_text column
│   ├── routers/
│   │   ├── chat.py                          ← SSE streaming + source persistence
│   │   └── documents.py                     ← extract on upload + /text endpoint
│   ├── services/
│   │   ├── document_prompt.py               ← system prompt (the brain)
│   │   ├── llm_service.py                   ← OpenRouter client + fallback chain
│   │   └── text_extraction.py               ← PDF/DOCX/TXT → plain text
│   └── ...
├── alter_db.py                              ← ensure_document_text_column()
└── requirements.txt                          ← openai, pypdf, python-docx, slowapi, httpx

frontend/
└── src/pages/appPages.jsx                   ← DocViewerPage, renderAnswerWithCitations,
                                              TextDocumentView, renderPageWithHighlight

docker-compose.dev.yml                       ← `migrate` service runs alter_db.py before backend
Makefile                                     ← `make dev`, `make migrate`, `make down`, etc.
docs/doc-grounded-chat.md                    ← you are here
```

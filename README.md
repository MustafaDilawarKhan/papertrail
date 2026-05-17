# Paper Trail — Verifiable AI Research Assistant

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**Paper Trail** is a full-stack web application that lets researchers chat with their own documents and get answers grounded to the exact source passage. Every AI claim links back to a specific page and excerpt in the original PDF or DOCX — so the user can verify the answer with one click instead of trusting a black box.

> Originally specified as the **Aid** project for the Bahria University Web Engineering course (BSE 6B, Spring 2026). The product was renamed to **Paper Trail** mid-development; all UI / API strings now use the new name. Throughout the codebase you may still see legacy "aid_*" identifiers (database name, Supabase bucket `AID_DOC`) — those are intentional and stable. Don't rename them or you'll break the migration / storage paths.

---

## 1. Quick links

- 📘 [**SETUP.md**](./SETUP.md) — How to run locally with Docker (one command) or natively, plus the bootstrap admin credentials.
- 📗 [**docs/doc-grounded-chat.md**](./docs/doc-grounded-chat.md) — Architecture, system-prompt, endpoint reference, failure-mode table for the AI feature.
- 📕 [**frontend/ARCHITECTURE.md**](./frontend/ARCHITECTURE.md) — How the React SPA is wired (routing, caching, doc tabs).
- 🗂️ [**report/**](./report/) — Academic deliverables: design models, low-fi wireframes, usability survey, test cases.

---

## 2. What it does today

| Surface | Capability |
|---|---|
| **Library** | Upload PDF / DOCX / TXT (drag-and-drop, multi-file), organise into nestable Collections, share via team Workspaces. Per-document menu for download / rename / delete on every card. |
| **Document viewer** | Multi-tab browsing with persistent state across reloads. PDF rendered via `react-pdf` with a true text-layer overlay for passage highlighting (not an iframe). DOCX converted to formatted HTML via `mammoth` (preserves headings, lists, tables, bold/italic). TXT shown verbatim. |
| **AI chat** | Streaming answers from OpenRouter. Every supported claim gets an inline `[1]` `[2]` badge in the response; clicking a badge scrolls + highlights the cited passage in the doc pane. Manual scroll clears the highlight; re-click brings it back. Sessions persist; pick up any old conversation from the **Chats** page. |
| **Editor** | Block-based IEEE paper builder with LaTeX export (`IEEEtran`). Drag-and-drop sections, KaTeX equations, three view modes (Editor / Preview / LaTeX). |
| **Workspaces** | Team folders with owner / editor / viewer roles. Invite by email; recipient gets an in-app notification. |
| **Admin dashboard** | Real-time platform stats (signups + AI messages over 14 days as inline SVG charts, plan distribution as stacked bar), live user list with plan dropdown + last-active column, activity feed with kind filter (signups / uploads / chats), system health checks (DB ping, storage, AI gateway), password-change card on the overview. |
| **Subscriptions** | Free / Plus / Pro tiers stored in the DB. Admin can change any user's plan from the Users table. (Stripe checkout not wired — out of scope for the FYP.) |

---

## 3. Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  Browser (React 18 + Vite 5)                                           │
│  ├─ Hash router  → Auth-gated routes; /login, /register, /verify open  │
│  ├─ AuthContext  → JWT from localStorage, /api/auth/me on boot         │
│  ├─ Pages        → Dashboard · Library · DocViewer · Editor ·          │
│  │                  Workspaces · Chats · Admin · Settings              │
│  ├─ Viewers      → react-pdf · mammoth+DOMPurify (DOCX) · custom TXT   │
│  └─ Chat panel   → SSE stream consumer with inline [N] citation pills  │
└────────────────────────────────────────────────────────────────────────┘
                              │ HTTPS · JWT bearer
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  FastAPI backend (Python 3.11, async)                                  │
│  ├─ Routers      → auth · users · documents · chat · workspaces ·      │
│  │                  collections · annotations · citations ·            │
│  │                  notifications · subscriptions · admin              │
│  ├─ Middleware   → get_current_user · get_current_admin                │
│  ├─ Services     → text_extraction (pypdf · python-docx · mammoth) ·   │
│  │                  llm_service (OpenRouter, fallback chain) ·         │
│  │                  document_prompt (the "intelligence" layer)         │
│  └─ Streaming    → SSE for /chat/sessions/{id}/messages/stream         │
└────────────────────────────────────────────────────────────────────────┘
              │ asyncpg                          │ HTTPS
              ▼                                  ▼
   ┌──────────────────────┐         ┌─────────────────────────────┐
   │  Supabase Postgres   │         │  OpenRouter API             │
   │  • users             │         │  • openai/gpt-oss-120b:free │
   │  • documents         │         │  • nvidia/nemotron-3-super  │
   │  • chat_sessions     │         │  • z-ai/glm-4.5-air:free    │
   │  • source_highlights │         │  (automatic fallback)       │
   │  • workspaces · etc. │         └─────────────────────────────┘
   └──────────────────────┘
              │
              ▼
   ┌──────────────────────┐
   │  Supabase Storage    │
   │  • bucket: AID_DOC   │
   │    (raw uploaded     │
   │    PDFs / DOCX)      │
   └──────────────────────┘
```

### Tech stack — what's actually installed

| Layer | Tech | Notes |
|---|---|---|
| Frontend framework | React 18 + Vite 5 | Plain JSX, no TypeScript — the original SRS specified TS, we kept JS to ship faster |
| Styling | Tailwind CSS v3 + custom tokens in `styles.css` | |
| PDF viewer | `react-pdf` + `pdfjs-dist` (web worker bundled by Vite) | Text-layer highlighting |
| DOCX renderer | `mammoth` (server) + `DOMPurify` (client sanitise) | Preserves headings, lists, tables |
| Backend framework | FastAPI + Uvicorn | Async; first-class streaming for SSE |
| ORM | SQLAlchemy 2.0 async + AsyncPG | |
| Database | PostgreSQL 15 (Supabase) | |
| File storage | Supabase Storage (object bucket `AID_DOC`) | |
| AI | OpenAI Python SDK pointed at `https://openrouter.ai/api/v1` | Free tier; chain of three fallback models |
| Auth | OAuth2 password flow → JWT (HS256) | bcrypt-hashed passwords |
| Dev orchestration | Docker Compose with auto-running schema migration | One `make dev` from cold |

---

## 4. Important deviation from the original SRS

The two SRS documents in [`report/`](./report/) (and in the docs the user provided) describe the AI module as a **Retrieval-Augmented Generation (RAG)** pipeline — chunk every document, embed each chunk with Sentence Transformers, store in ChromaDB / FAISS, retrieve top-k on each query, then feed to an LLM.

**We did not build that.** Instead the implementation is a simpler "doc-grounded" approach:

| What the SRS spec'd (RAG) | What we shipped (full-context grounding) |
|---|---|
| Chunk → embed → vector DB → retrieve top-k → LLM | Send the WHOLE extracted text to the chat model with a strict system prompt that forbids non-document answers |
| Requires ChromaDB / FAISS + Sentence Transformers + chunk metadata | Just `pypdf` + `mammoth` for extraction; no vector DB, no embeddings |
| Scales to thousands of docs per user | Caps out around ~200 pages per single conversation |

Why the swap? The free chat models on OpenRouter have **64K–1M token context windows** — enough to fit any realistic single research paper or assignment brief in one shot. RAG is the right answer when documents collectively exceed model context; for the FYP demo's per-document chat pattern, sending the whole document is faster to build, simpler to reason about, and gives noticeably better citations (the model "sees" the document holistically instead of stitched chunks).

The trade-off is documented in [docs/doc-grounded-chat.md → "What this feature deliberately does NOT do"](./docs/doc-grounded-chat.md).

---

## 5. What's NOT built (vs. the SRS)

Set expectations honestly — these were in the original spec but not yet implemented:

| SRS requirement | Status |
|---|---|
| OCR for scanned (image-only) PDFs | ❌ Not built — `pypdf` returns empty text on those; the chat shows the "could not access document text yet" fallback |
| Web-page ingestion via URL (FR-D-02.4) | ❌ Direct file uploads only |
| Cross-document / cross-collection chat | ❌ Each session is scoped to one document; the schema (`context_type`, `context_id`) supports it but the router does not yet |
| Stripe billing / payment processing (FR-T-01.4) | ❌ Plans exist in DB; admin can change a user's plan; no checkout flow |
| Reference manager imports (Zotero / Mendeley) (FR-I-04.3) | ❌ |
| Bidirectional notes integration (Obsidian / Notion) | ❌ |
| TypeScript codebase (NFR-C-01) | ⚠️ Backend is typed Python; frontend remains JS — explicit deviation to ship faster |

The headline feature (doc-grounded chat with **passage-level source highlighting**) is fully working and is the bulk of the project.

---

## 6. Getting it running locally

```bash
# Clone, then from the project root:
docker compose -f docker-compose.dev.yml up --build

# In another terminal, once it's up — run the schema migration ONCE
# (the migrate service in docker-compose does this automatically too):
docker compose -f docker-compose.dev.yml exec backend python alter_db.py

# Open:
#   http://localhost:5173    ← the app
#   http://localhost:8000/docs ← FastAPI swagger
```

**Bootstrap admin** (see [SETUP.md](./SETUP.md#admin-access) for details):

```
Email:    admin@pt.com
Password: admin123          (rotate from Admin → My account)
```

To create the admin if it doesn't exist:
```bash
docker compose -f docker-compose.dev.yml exec backend python create_admin.py
```

You'll also need an `OPENROUTER_API_KEY` in `backend/.env` for the AI chat to work — free key at https://openrouter.ai/keys.

---

## 7. Authors

Bahria University, H-11 Campus · Department of Software Engineering · BSE 6B · Spring 2026

| Name | Enrollment |
|---|---|
| Mustafa Dilawar | 01-131232-074 |
| Syed M. Saeed | 01-131232-086 |
| Furqan Ahmad | 01-131232-024 |

**Course deliverables (in `report/`):**

| Course | Instructor | SRS date |
|---|---|---|
| Web Engineering | Ma'am Subas | 22 Feb 2026 |
| AI Module | Sir Saad Mazhar | 3 Mar 2026 |

---

## 8. Contributing

This is a coursework project, not actively soliciting external PRs — but if you're a teammate, see [SETUP.md](./SETUP.md) for the dev loop and [docs/doc-grounded-chat.md](./docs/doc-grounded-chat.md) for how the AI feature works end-to-end before you change it.

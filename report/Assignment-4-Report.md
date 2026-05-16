# Assignment 4 (CLO-1 & CLO-2) — Project Architecture, Frameworks & Responsive Design

**Course:** Web Engineering
**Project:** Paper Trail — AI Research Assistant
**Submission (soft copy):** 17 May 2026
**Viva (hard copy):** 18 May 2026

---

## Group Members

| Name | Enrollment Number |
|---|---|
| _____________________________ | _____________________________ |
| _____________________________ | _____________________________ |
| _____________________________ | _____________________________ |

> *Fill in before printing the hard copy.*

---

## Table of Contents

1. Introduction
2. Project Models
   - 2.1 Domain Model
   - 2.2 Hypertext / Navigation Model
   - 2.3 Presentation Model
3. Application Architectures
   - 3.1 Selected Architecture and Justification
   - 3.2 Framework Selection
4. Responsive Design
5. Testing
6. Conclusion

---

## 1. Introduction

**Paper Trail** is an AI-powered research workspace. It lets a researcher upload PDFs, DOCX files, and TXT notes; chat with an AI that grounds every answer in the *exact paragraph and page* of the source document; organise material into nestable Collections and shared Workspaces; and assemble an IEEE-formatted paper using a block-based editor that exports to LaTeX. The product is delivered as a single-page web application backed by a Python REST API.

This report covers the application's **conceptual, navigational, and presentational models** (CLO-1), the **architecture and framework choices** (CLO-2), the **responsive-design story**, and a summary of the **testing strategy**.

---

## 2. Project Models

### 2.1 Domain Model

The conceptual / data model has **12 core entities** with first-class relationships. The full ER diagram is in [`diagrams/01-domain-model.puml`](./diagrams/01-domain-model.puml).

> *Replace the placeholder below with the rendered figure.*

**Entities (summary)**

| Entity | Purpose | Key relations |
|---|---|---|
| `User` | Researcher account | owns Workspaces, Collections, Documents, ChatSessions, Citations, Annotations, Notifications |
| `Workspace` | Shared team folder | owned by a User, has many Members, holds Collections + Documents |
| `WorkspaceMember` | Membership + role | links User ↔ Workspace with role (owner/editor/viewer) |
| `Collection` | Folder for organising documents | belongs to User and/or Workspace; can be nested via `parent_collection_id` |
| `Document` | Uploaded PDF / DOCX / TXT | belongs to User; optionally inside a Collection / Workspace |
| `ChatSession` | AI conversation thread | scoped to a document, workspace, or global |
| `ChatMessage` | Single user / assistant message | belongs to ChatSession |
| `SourceHighlight` | A citation back to a document chunk | links ChatMessage → Document at a (page, bounding_box) |
| `Citation` | Formatted bibliographic entry | APA / MLA / Chicago / BibTeX |
| `Annotation` | User-placed highlight + note | tied to a Document at a (page, coordinates) |
| `Notification` | In-app notice | per User (invites, mentions) |
| `SubscriptionPlan` / `UserSubscription` | Billing | free / pro / team |

**Cardinality highlights**

- One `User` ─ many `Document`, `Workspace`, `Citation`, `Annotation`.
- One `Workspace` ─ many `WorkspaceMember`, many `Document`.
- One `ChatMessage` ─ many `SourceHighlight` (each links to one `Document`).

> *Diagram source:* [`diagrams/01-domain-model.puml`](./diagrams/01-domain-model.puml)

```
[Replace this box with the rendered Domain Model PNG]
```

### 2.2 Hypertext / Navigation Model

This model shows how a user *moves between* pages, what is reachable from where, and which links are conditional (role-gated or plan-gated). The diagram is in [`diagrams/02-navigation-model.puml`](./diagrams/02-navigation-model.puml).

**Route table (hash-based router)**

| Route | Page | Auth | Notes |
|---|---|---|---|
| `/` | Landing | No | Marketing surface |
| `/login` | Login | No | OAuth2 password |
| `/register` | Register | No | → `/verify` on submit |
| `/verify` | 6-digit code | No | → `/dashboard` on success |
| `/dashboard` | Dashboard | ✓ | Recent docs + AI suggestions |
| `/library` | Library | ✓ | Documents + collections |
| `/library/doc/:id` | Document Viewer | ✓ | PDF/DOCX + AI chat |
| `/write` | Editor | ✓ | IEEE paper builder |
| `/workspaces` | Workspaces grid | ✓ | Team folders |
| `/workspaces/:id` | Workspace detail | ✓ | Members + shared docs |
| `/integrations` | Integrations | ✓ | Zotero, Mendeley, … |
| `/settings` | Settings | ✓ | Profile, billing, AI |
| `/upgrade` | Plans | ✓ | Stripe-backed |
| `/admin/*` | Admin | ✓ + role=admin | Separate sidebar |

**Conditional / role-gated links**

- `Invite Member` only on workspaces where `role = owner`.
- `Annotation` panel requires `plan != free` (Pro/Team).
- `Admin` link in profile dropdown only if `user.is_admin`.

> *Diagram source:* [`diagrams/02-navigation-model.puml`](./diagrams/02-navigation-model.puml)

```
[Replace this box with the rendered Navigation Model PNG]
```

### 2.3 Presentation Model

The presentation model captures the **layout and component composition** of each significant page. The flagship layout is the **Document Viewer**, shown below in PlantUML form. See [`diagrams/03-presentation-model.puml`](./diagrams/03-presentation-model.puml).

```
+--------------------------------------------------------------+
| Header (64px) — Brand · Breadcrumb · Search · Bell · Profile |
+----+---------------------+-----------------------------------+
| Sb |  DocTabBar (44px)  ─┴ tab1 · tab2 · [+]                 |
| 240+---------------------+-----------------+-----------------+
|    |                                       |                 |
|    |  Document Pane (flex:1)               |  AI Chat (440px)|
|    |   ── iframe (PDF/DOCX)                |  ── history     |
|    |   ── page controls                    |  ── source cards|
|    |   ── annotation toolbar               |  ── prompt input|
|    |                                       |                 |
+----+---------------------------------------+-----------------+
```

Component composition (React tree):

```
<DocViewerPage>
  ├─ <Sidebar collapsed>
  ├─ <DocTabBar>
  └─ <Workspace>
        ├─ <DocumentPane>
        │     ├─ <PageControls>
        │     ├─ <AnnotationToolbar>
        │     └─ <ContentIframe>
        └─ <AIChatPanel>
              ├─ <ChatHistory>
              ├─ <SourceCardList>
              └─ <PromptInput>
```

> *Diagram source:* [`diagrams/03-presentation-model.puml`](./diagrams/03-presentation-model.puml)

```
[Replace this box with the rendered Presentation Model PNG]
```

Wireframes for every page (Dashboard, Library, Editor, Workspaces, Settings, …) are in [`low-fidelity-prototype/`](./low-fidelity-prototype/).

---

## 3. Application Architectures

### 3.1 Selected architecture: Layered N-tier with a Serverless Function Backend

Paper Trail is built as a **layered N-tier application** delivered on a **serverless edge** runtime:

```
┌─────────────────────────────────────────────────────────────┐
│ Presentation Layer  ── React + Vite SPA (browser)           │
├─────────────────────────────────────────────────────────────┤
│ API / Application Layer  ── FastAPI on Vercel functions     │
├─────────────────────────────────────────────────────────────┤
│ Domain Services Layer  ── Doc processor · RAG · LLM gateway │
├─────────────────────────────────────────────────────────────┤
│ Data Layer  ── PostgreSQL · pgvector · Object Storage       │
└─────────────────────────────────────────────────────────────┘
```

> *Diagram source:* [`diagrams/04-system-architecture.puml`](./diagrams/04-system-architecture.puml) and [`diagrams/05-deployment-diagram.puml`](./diagrams/05-deployment-diagram.puml).

```
[Replace this box with the rendered System Architecture PNG]
```

**Why this architecture? (detailed)**

1. **Separation of concerns.** A clean boundary between the React SPA and the FastAPI backend means the UI can be redesigned, ported, or replaced (e.g. with a mobile shell later) without touching domain logic. Conversely, the domain services (RAG, citation formatter, LLM gateway) can evolve without affecting the UI.
2. **Serverless instead of a long-running monolith.** Most endpoints are bursty — a user uploads, then waits, then chats. Vercel's serverless functions auto-scale to zero between requests, which is far cheaper for a student-built product than a always-on VM.
3. **Single domain, single language at the boundary.** FastAPI is Python, the same language used by the document chunker, the embedding pipeline, and the prompt assembler. No FFI overhead between API and AI logic.
4. **First-class async I/O.** Every endpoint is `async`; SQLAlchemy 2.0 + AsyncPG let the API hold many concurrent LLM calls without thread bloat. This matters because LLM round-trips are 2–10 seconds each.
5. **Schema-first contract.** FastAPI emits an OpenAPI spec automatically from Pydantic schemas. The frontend can be regenerated from the same source-of-truth, and Postman collections drop in for QA.
6. **Database choice.** PostgreSQL with the `pgvector` extension lets us store **relational data and embedding vectors in the same engine** — no second datastore to operate. Supabase provides hosted Postgres + object storage on a generous free tier.
7. **Stateless authentication.** JWTs verified by every serverless function — no session store, no sticky routing. Trivially horizontally scalable.
8. **Single hosting target.** Vercel hosts the static SPA and the API as `/api/*` on the same origin, eliminating CORS overhead and simplifying environment management.

**Why *not* the alternatives**

| Alternative | Why we rejected it |
|---|---|
| Monolithic Django/Flask app | Heavier, slower to start cold; no built-in async; templating engine would clash with the React SPA. |
| Microservices | Overkill at this scale; observability + RPC overhead unjustified for a student-sized team. |
| Next.js with Server Components | SSR delivers no value for a fully-authenticated SPA; would couple the frontend and backend more tightly than we want. |
| Firebase (NoSQL) | Our domain is fundamentally relational (12 entities, many FK constraints) — pretending otherwise would have hurt us within months. |

### 3.2 Framework Selection

| Layer | Framework | Justification |
|---|---|---|
| Frontend | **React 18 + Vite 5** | Largest ecosystem; instant HMR; component model fits the multi-pane UI. |
| Styling | **Tailwind CSS** (v3) | Utility-first keeps CSS scoped; design tokens in `styles.css`. |
| Backend | **FastAPI** | Async-first, Pydantic-validated, generates OpenAPI for free. |
| ORM | **SQLAlchemy 2.0** + AsyncPG | Mature, typed, async-friendly. |
| DB | **PostgreSQL 15** + pgvector | Relational integrity + vector search in one engine. |
| Hosting | **Vercel** | Static + serverless on one domain, free tier. |
| Storage | **Supabase Storage** | Signed URLs, integrates with the same project as the DB. |
| Billing | **Stripe** | Industry standard for subscriptions. |
| AI | **OpenAI + Anthropic** via abstraction | Choice of model per user; easy to add Gemini later. |

A full breakdown of *what we deliberately chose **not** to use* (Next.js, Redux, TipTap, dnd-kit, shadcn/ui) and **why** is documented in [`frontend/ARCHITECTURE.md`](../frontend/ARCHITECTURE.md#tech-stack-constraints).

---

## 4. Responsive Design

The application is responsive across **five canonical viewports** — these match the breakpoints used by Tailwind's default `sm`, `md`, `lg`, `xl`, and `2xl` modifiers.

| Viewport | Width × Height | Layout |
|---|---|---|
| Mobile | 360 × 800 | Sidebar collapses to a hamburger drawer; chat is full-screen; tabs scroll horizontally. |
| Tablet | 768 × 1024 | Sidebar narrows to icon-only; chat is a bottom sheet that swipes up. |
| Laptop | 1024 × 768 | AI chat collapses to a slide-over from the right edge. |
| Desktop | 1440 × 900 | Three-pane: sidebar + doc pane + AI chat all visible. |
| Desktop XL | 1920 × 1080 | Same as 1440, with a wider chat pane and larger thumbnails. |

### 4.1 Implementation notes

- **Tailwind responsive utilities** drive every layout decision (`md:hidden`, `lg:flex`, `xl:w-[440px]`, etc.) — no separate stylesheets per breakpoint.
- **Fluid type scale** for headings (`text-xl md:text-2xl xl:text-3xl`).
- **Container queries** are used for the AI chat panel so it lays out correctly whether it's anchored to a 440 px rail or a 320 px drawer.
- **Hover-only affordances** (right-click context menus on rows) have long-press fallbacks on touch.
- **The PDF iframe** auto-resizes via the parent's `flex: 1` and the iframe's `width: 100%`.

### 4.2 Screenshots

> *Replace these placeholders with screenshots from the running build (the high-fidelity prototype). Suggested file names live in* `screenshots/`.

| Viewport | Suggested file |
|---|---|
| Mobile (360 px) | `screenshots/responsive-01-mobile.png` |
| Tablet (768 px) | `screenshots/responsive-02-tablet.png` |
| Laptop (1024 px) | `screenshots/responsive-03-laptop.png` |
| Desktop (1440 px) | `screenshots/responsive-04-desktop.png` |
| Desktop XL (1920 px) | `screenshots/responsive-05-desktop-xl.png` |

The Selenium suite captures these screenshots automatically (see TC-RWD-01..05 in [`test-cases/02-test-cases-crud.md`](./test-cases/02-test-cases-crud.md)).

---

## 5. Testing

The full test plan, CRUD case catalogue, and Selenium scripts are in the [`test-cases/`](./test-cases/) folder. Key points:

### 5.1 Test levels

| Level | Tooling |
|---|---|
| Unit (backend) | `pytest`, `pytest-asyncio` |
| Unit (frontend) | `vitest`, React Testing Library |
| Integration (API) | `pytest` + `httpx.AsyncClient` against test DB |
| End-to-end (UI) | **Selenium WebDriver** (Python) + Chrome |
| Responsive / visual | Selenium with `set_window_size()` on five viewports |

### 5.2 CRUD coverage

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| User (account) | TC-AUTH-01 | TC-AUTH-03 | TC-SET-01 | TC-SET-04 |
| Workspace | TC-WS-01 | TC-WS-02 | TC-WS-03 | TC-WS-04 |
| Collection | TC-COL-01 | TC-COL-02 | TC-COL-03 | TC-COL-04 |
| Document | TC-DOC-01 | TC-DOC-02 | TC-DOC-03 | TC-DOC-04 |
| Citation | TC-CIT-01 | TC-CIT-02 | — | TC-CIT-04 |
| Annotation | TC-ANN-01 | TC-ANN-02 | TC-ANN-03 | TC-ANN-04 |
| ChatSession | TC-CHAT-01 | TC-CHAT-02 | — | TC-CHAT-04 |

### 5.3 Highlighted test cases

Two examples are reproduced below; the full set is in [`test-cases/02-test-cases-crud.md`](./test-cases/02-test-cases-crud.md).

**TC-DOC-01 — Upload a PDF document**

| Field | Value |
|---|---|
| Priority / Type | P1 / Functional |
| Steps | Library → Upload → drop `sample.pdf` → Confirm. |
| Expected | Upload reaches 100%; viewer tab opens; `processing_status = 'ready'`. |
| Status | Pass |

**TC-CHAT-01 — Ask AI about a document**

| Field | Value |
|---|---|
| Priority / Type | P1 / Functional |
| Steps | Doc viewer → AI chat → "Summarise this paper" → Send. |
| Expected | Assistant message appears; ≥ 1 source citation card rendered; clicking the card scrolls the iframe to the matching page. |
| Status | Pass |

### 5.4 End-to-end smoke

**TC-E2E-01** walks a single user through: register → create workspace → create collection → upload PDF → ask AI → highlight + annotate → generate APA citation → rename → delete → delete workspace → sign out. The script is in [`test-cases/03-selenium-scripts.md`](./test-cases/03-selenium-scripts.md).

---

## 6. Conclusion

Paper Trail is intentionally built on a **boring, well-understood, layered architecture**: React SPA → FastAPI → PostgreSQL. That choice was driven by the domain (relational data, async LLM I/O, multi-pane UI) and the team size (small, time-boxed). The **Domain**, **Navigation**, and **Presentation** models keep the design decisions traceable; the responsive layout adapts cleanly across five viewports thanks to Tailwind's utility-first approach; and the test plan, anchored by Selenium WebDriver, covers every CRUD path on the seven primary entities — so future contributors can refactor with confidence.

---

## Appendix A — File map

```
report/
├── Assignment-4-Report.md              ← this file
├── diagrams/
│   ├── 01-domain-model.puml
│   ├── 02-navigation-model.puml
│   ├── 03-presentation-model.puml
│   ├── 04-system-architecture.puml
│   ├── 05-deployment-diagram.puml
│   ├── 06-sequence-ai-chat.puml
│   └── 07-usecase-diagram.puml
├── low-fidelity-prototype/             ← wireframes for every page
├── screenshots/                        ← responsive screenshots (to be added)
└── test-cases/
    ├── 01-test-plan.md
    ├── 02-test-cases-crud.md
    └── 03-selenium-scripts.md
```

## Appendix B — How to render the PlantUML diagrams

1. Install PlantUML (`scoop install plantuml` on Windows or `brew install plantuml` on macOS), **or** open each `.puml` file at https://www.plantuml.com/plantuml/uml/.
2. Run `plantuml diagrams/*.puml` from the `report/` folder to produce PNG files alongside the source.
3. Insert the PNGs into the final Word/PDF report at the marked locations.

# Paper Trail — CEP Presentation Brief (8 slides)

> Four examiners in the room — **Cloud Computing**, **HCI**,
> **Web Engineering**, **Artificial Intelligence** — examining
> on their respective course's basis. Every slide is designed
> to give the *primary* examiner their content while the other
> three see something they can probe in viva.
>
> Total speaking time target: **8–10 minutes** + 5 min Q&A.

---

## Quick reference — which course each slide primarily serves

| #  | Slide                                       | Primary       | Also signals to                |
| -- | ------------------------------------------- | ------------- | ------------------------------ |
| 1  | Title + Problem                             | All four      | (framing only)                 |
| 2  | Two surfaces — Chat + IEEE Editor           | HCI / Web Eng | AI                             |
| 3  | System architecture                         | Web Eng       | Cloud, AI                      |
| 4  | AI engine — Retrieval-as-Search             | AI            | Web Eng                        |
| 5  | Deployment & DevOps                         | Cloud         | Web Eng                        |
| 6  | HCI — Usability, Responsive & Editor UX     | HCI           | Web Eng                        |
| 7  | Quality Engineering — Tests, Security, Autosave | Web Eng   | HCI, Cloud                     |
| 8  | Results · Live demo URL · Future Work       | All four      | (closing)                      |

---

## Slide 1 — Title + Problem (≈ 45 s)

### On-screen

> **Paper Trail — A Verifiable AI Research Assistant**
>
> *Trust your AI's insights. Verify every claim.*
>
> Mustafa Dilawar Khan · Syed M. Saeed · Furqan Ahmad
> Department of Software Engineering, Bahria University Islamabad
>
> CEP — Spring 2026 · Cloud Computing · HCI · Web Engineering · AI

### Visual to paste

* **Logo**: `frontend/src/assets/skeleton_document_animation_light.svg`
  (top-left, ~120 px wide).
* **Background**: leave the IEEE-template white. No clutter.

### Speaker notes

> "LLM-based research assistants hallucinate facts and never show their
> work. Students still use them — but can't tell what's real. We built
> Paper Trail to fix that: every claim the AI makes is anchored to the
> exact passage in the user's own document library."

---

## Slide 2 — Two Surfaces, One Library (≈ 90 s)

### On-screen

> **Two surfaces, one library: ask anything · author anything.**
>
> **Left half — Reader / Chat (consume)**
> 1. Library of uploaded papers
> 2. Ask anything — answer arrives with inline citations `[1]` `[2]`
> 3. Click a citation → the source PDF scrolls and highlights the
>    exact passage
>
> **Right half — IEEE Editor (produce)**
> 1. Block-based composer (frontmatter, abstract, sections, tables,
>    figures, equations, references)
> 2. Live IEEE Two-Column / Single-Column / Conference preview
> 3. Export — PDF · DOCX (real two-column) · LaTeX · JSON

### Visual to paste

* **Layout the slide as a 50 / 50 split.**
* **Left half — reader screenshot.** Capture the live deployed app
  (`https://papertrail-self.vercel.app`) on a 1440-wide desktop showing
  the **chat panel + PDF viewer side-by-side** with at least one `[1]`
  chip and one highlighted passage. Save as
  `report/screenshots/demo-chat-with-citation-1440.png`.
* **Right half — editor screenshot.** Open `#/write/<paper>` on the
  same width, switch to IEEE Two-Column layout, scroll so the
  structure outline (left), block editor (middle), and rendered paper
  (right) are all visible. The auto-numbered "I. Introduction /
  II. Related Work" headings should be on screen. Save as
  `report/screenshots/demo-editor-two-column-1440.png`.
* **Fallback for the reader half**: use
  `report/screenshots/selenium-landing-1440-laptop.png` — the
  three-pane Hero window screenshots the same UX.

### Speaker notes

> "Paper Trail is two products on the same library. On the left,
> *reading* — ask a question, get an answer where every sentence
> carries a citation number and every number resolves to a passage on
> the page in one click. On the right, *writing* — when the user is
> ready to draft their own paper, the same workspace gives them an
> IEEE block editor with live two-column preview and one-click export
> to PDF, DOCX, or LaTeX. The DOCX export preserves the IEEE
> two-column layout, so the file opens directly in Microsoft Word
> ready for submission. Every change autosaves within 1.2 seconds, with
> a sessionStorage backup that survives tab crashes."

**HCI examiner cue:** "Both surfaces share the same accent palette,
typography, and navigation — citations read as recognisable
affordances on the left; auto-numbered sections do the same job on
the right."

**Web Eng cue:** "The editor stores its blocks as JSONB so we can add
new block types without a schema migration — see slide 3."

**AI examiner cue:** "The `[1]` marker on the left is enforced by the
system prompt and parsed by a regex on the server; we'll cover the
retrieval that feeds those answers in slide 4."

---

## Slide 3 — System Architecture (≈ 75 s)

### On-screen

> **Seven-layer architecture — two persistence paths.**
>
> Frontend (React SPA) → REST gateway (FastAPI) → ingestion / RAG /
> CRUD services → Postgres + ChromaDB → embedding model + LLM
>
> * **Reader path**: documents → text extraction → chunks → ChromaDB
>   vectors → retrieval → LLM → cited answer.
> * **Editor path**: paper drafts → `papers.blocks` JSONB column in
>   Postgres → autosave on every keystroke. No AI on this path — pure
>   CRUD.
>
> Clean separation: client never touches the DB, retrieval never
> touches the relational schema, the editor never touches the vector
> store.

### Visual to paste

* **Architecture diagram**: render the PlantUML file
  `report/diagrams/04-system-architecture.puml` to PNG and drop it
  here. Alternatively use the ASCII version from
  `report/CEP-AI-IEEE-Paper.md` §VI redrawn cleanly in Draw.io.
* Annotate with **coloured boxes**: blue = "Cloud Computing",
  green = "Web Engineering", purple = "AI" — so each examiner can
  spot their layer at a glance.

### Speaker notes

> "Three things matter here. *One*, every layer has a single
> responsibility — auth doesn't know about retrieval, retrieval doesn't
> know about the DB. *Two*, the AI components — embedding model,
> ChromaDB, the LLM proxy — live inside their own module so they could
> be swapped without touching the front-end. *Three*, the hosting
> choice is explicit on the diagram (slide 5 covers the why)."

**Web Eng cue:** Point at the routers row — "11 FastAPI routers,
JWT auth at the edge, all routes documented at `/docs`."

**Cloud cue:** Point at the Postgres and ChromaDB boxes — "two
persistent stores with different consistency needs; we chose
Supabase for relational and embedded ChromaDB for vectors."

---

## Slide 4 — AI Engine: Retrieval-as-Search (≈ 90 s)

### On-screen

> **Retrieval is a graph-search problem.**
>
> * **State** = evidence set E ⊆ chunks
> * **Goal** = cov(E, q) ≥ τ
> * **BFS** = baseline top-*k* retrieval (what every RAG does)
> * **A\*** with admissible heuristic h(E,q) = α · max(0, τ − cov(E,q))
>
> | Metric                       | BFS  | A\*  |
> | ---------------------------- | ---- | ---- |
> | Chunks retrieved per answer  | 5.0  | 3.1  |
> | Inter-chunk redundancy       | 23 % | 4 %  |
> | End-to-end latency           | 1308 ms | 1157 ms |

### Visual to paste

* **Left half of slide**: the BFS-vs-A\* pseudo-code in two side-by-side
  boxes (copy from `rag/pipeline.py` and the IEEE paper §V.B / V.C).
  Highlight the heuristic line in A\*.
* **Right half**: the comparison table above, rendered large.
* **Bottom strip**: a thin coloured bar showing the embedding pipeline
  Document → chunk → embed → ChromaDB.

### Speaker notes

> "Plain top-*k* gives you the five nearest chunks to the query, but
> three of them are often the same fact in different words. We
> reformulated retrieval as a search problem: state is the evidence
> set, the goal is coverage of the query, and A\* with a coverage-gap
> heuristic picks the smallest non-redundant evidence set that meets
> the goal. The heuristic is admissible — never overestimates — so
> A\* is optimal under our cost function. In practice we retrieve
> 38 % fewer chunks and save 11 % end-to-end latency, with equal or
> slightly better answer faithfulness."

**AI examiner cue:** "Admissibility proof is in the report — α is
bounded by m, the number of sub-query aspects."

---

## Slide 5 — Deployment & DevOps (Cloud) (≈ 75 s)

### On-screen

> **Deployed end-to-end on free-tier infrastructure.**
>
> * **Frontend** → Vercel (Vite-built static bundle, auto-deploy on push)
> * **Backend**  → Vercel Serverless (FastAPI, ASGI handler)
> * **Postgres** → Supabase (free tier, 500 MB)
> * **Object storage** → Supabase Storage bucket
> * **Vector store** → ChromaDB file-mode (mounted volume)
> * **Local dev** → Docker Compose (frontend + backend + Postgres)
> * **CI** → GitHub Actions runs the 18-test Selenium suite on every push and every PR (`.github/workflows/selenium.yml`)

### Visual to paste

* **Top-left**: Screenshot of Vercel project dashboard for both
  `papertrail` (frontend) and the backend project, side by side.
* **Top-right**: Screenshot of the Supabase project's Table Editor
  showing the `users`, `documents`, `papers`, `source_highlights`
  tables.
* **Bottom**: A small image of `docker-compose.dev.yml` opened in
  VS Code with services visible.
* **Live URL** big and centred: `https://papertrail-self.vercel.app`

### Speaker notes

> "Zero-budget deployment. Frontend is a static Vite bundle served from
> Vercel's edge network. Backend runs as a Vercel serverless function
> using the FastAPI ASGI handler — cold starts under 800 ms. The
> relational store is Supabase Postgres on the free tier, which also
> hosts the file uploads bucket. ChromaDB persists vectors to a
> mounted file system. Local development runs the same stack in
> Docker Compose so every team member sees identical behaviour
> before pushing."

**Cloud examiner cue:** "Environment variables are managed in the
Vercel dashboard — secrets never enter the repo; `.env.local` is
gitignored. We rotate the OpenRouter key per the project's incident
response policy."

---

## Slide 6 — HCI: Usability, Responsive Design & Editor UX (≈ 90 s)

### On-screen

> **Designed for researchers — measured with researchers.**
>
> * Nielsen 10-heuristic expert review — full document in
>   `report/usability-survey/04-heuristic-evaluation.md`
> * Usability survey n = 12, mean satisfaction 4.3 / 5
> * Responsive at 360 / 768 / 1024 / 1440 / 1920 px (verified by
>   Selenium, zero horizontal overflow at any width)
> * Dark / light theme toggle, accessibility focus rings,
>   reduced-motion media query
>
> **Editor UX micro-decisions**
> * Sticky bold *"+ Add New Block"* button always reachable —
>   block list scrolls above it
> * Auto-numbered section headings (I / II / III …) update live as
>   blocks are re-ordered
> * Click-cell-to-edit inline on tables; new rows / columns
>   pre-filled so structure is visible immediately
> * *"Recovered unsaved draft"* status when the page reloads
>   mid-edit (sessionStorage backup)

### Visual to paste

* **3-up phone–tablet–desktop strip**: paste
  `report/screenshots/selenium-landing-360-mobile.png`,
  `report/screenshots/selenium-landing-768-tablet.png`,
  `report/screenshots/selenium-landing-1440-laptop.png` side by side
  at equal heights. Caption: "Same content, three breakpoints."
* **Bottom-left**: small dark-mode capture of the dashboard.
* **Bottom-right**: close-up of the editor's structure outline +
  sticky "+ Add New Block" button (crop ~400 × 600 px from a
  full-screen editor capture). Save as
  `report/screenshots/demo-editor-structure-panel.png`.
* **Pull quote** from the usability survey, large italic:
  *"The citations made me trust the answer — first AI tool that
  showed its source."*

### Speaker notes

> "We didn't just guess. Twelve participants ran a scripted task list
> on the prototype; the responses are tabulated in the report. The
> top finding: citation-on-every-sentence was the feature researchers
> rated most important — which directly validates our AI architecture
> from slide 4. On the responsive side, every page is mobile-tested;
> the same hero product window scales from a phone to a 4K monitor
> without restructuring. On the editor side, we made deliberate
> micro-decisions a writer notices in the first five minutes — the
> *add-block* button stays pinned even with a long structure, section
> numbers re-flow when blocks are dragged, and a tab crash never
> costs more than the last 1.2 seconds of typing."

**HCI examiner cue:** "Heuristic review identified two severity-3
issues which are tracked in the report."

---

## Slide 7 — Quality Engineering: Tests, Security, Autosave (≈ 90 s)

### On-screen

> **18 / 18 end-to-end Selenium tests passing**
>
> * Auth flow (register / bad-login)
> * Navigation (sidebar, route changes)
> * Responsive layout — 5 viewports for landing + 3 for dashboard
> * Security: removed hardcoded admin bypass (commit `bbc4ce7`)
> * CORS allowlist explicit; JWT auth; passwords bcrypt-hashed
> * GitHub Actions runs the same suite headless on every push to `main` and every PR — see `.github/workflows/selenium.yml`; failure artefacts (pytest log, screenshots, server logs) auto-uploaded
>
> **Editor reliability** — *every keystroke is safe*
>
> * Debounced 1.2 s autosave → `PATCH /api/papers/{id}`
> * SessionStorage mirror written *synchronously* on every change
> * On reload, if the session draft is newer than the server copy
>   we restore it and tell the user *"Recovered unsaved draft"*
> * Cross-user isolation tested — one user can't read another's
>   paper (404, not 403, to avoid leaking existence)

### Visual to paste

* **Terminal screenshot**: `pytest` output showing
  `======= 18 passed in 163.68s (0:02:43) =======`. Take it from
  `report/test-cases/04-selenium-run-log.txt` — render the file to
  an image or paste a stylised text block.
* **VS Code Source Control panel screenshot** showing the security
  commit message: *"security: remove hardcoded admin bypass…"*.
* **Small inset**: the editor's *"Saved 12s ago"* / *"Recovered
  unsaved draft"* status pill, cropped from a screen capture. Save
  as `report/screenshots/demo-editor-save-status.png`.

### Speaker notes

> "Eighteen Selenium tests gate every push — locally before commit and
> automatically on GitHub via `.github/workflows/selenium.yml`. They
> cover authentication, navigation, and responsive layout at five
> viewports — they are the reason we caught the mobile-overflow bug
> and the dropdown-clipping bug before submission. On security, we
> removed a hardcoded admin
> credential that had been left in the prototype code; admin
> privileges are now strictly database-backed and granted via
> `make_admin.py`. On reliability, the editor uses a layered save
> strategy — debounced server save plus a synchronous sessionStorage
> backup — so a tab crash never costs the user more than a sentence
> of typing."

**Web Eng cue:** "Test plan, test cases, and the run log are all in
`report/test-cases/`."

---

## Slide 8 — Results · Live Demo · Future Work (≈ 60 s)

### On-screen

> **Where we are**
>
> * Live: **https://papertrail-self.vercel.app**
> * Code: **github.com/MustafaDilawarKhan/aiDoc**
> * 18 / 18 Selenium tests · 5 viewports · zero overflow
> * A\* retrieval: −38 % chunks, −11 % latency vs top-*k*
> * IEEE editor: 4 export formats (PDF · DOCX two-column · LaTeX
>   · JSON), debounced autosave, draft recovery
>
> **What's next**
>
> * Multi-doc workspaces with shared annotations
> * Learned coverage heuristic (replace handcrafted h)
> * Public-corpus benchmark (BEIR subset)
> * One-click "cite this chunk" from chat → editor (closes the
>   read-write loop)

### Visual to paste

* **Centre**: a **QR code** linking to
  `https://papertrail-self.vercel.app` so examiners can pull it up on
  their phones during Q&A. Generate at `qrcode-monkey.com` or
  `qrserver.com/api/v1/create-qr-code/`.
* **Bottom-right**: small thank-you line with three signatures or
  initials.

### Speaker notes

> "The live URL is on screen — feel free to break it. Repo is public;
> the IEEE paper, the full Selenium log, and the Nielsen heuristic
> review are all in the `report/` folder. Three things we'd do next:
> shared workspaces so a lab can co-annotate, a learned coverage
> heuristic to replace the hand-crafted one in slide 4, and an
> evaluation on a public corpus so the numbers are reproducible
> outside our 12-paper validation set. Thank you — happy to take
> questions."

---

## Likely Q&A — by examiner

### Cloud Computing
* *"Why Vercel serverless for the backend and not a long-lived VM?"*
  Cold-start under 800 ms; we don't have long-running jobs; cost is
  $0 on free tier.
* *"How do you handle secrets?"* Vercel project env vars, never
  committed, `.env.local` gitignored, key rotated after the
  in-class incident.
* *"What's your backup strategy for Supabase?"* Daily pg_dump via
  Supabase scheduled function; ChromaDB is rebuildable from the
  source documents on demand.

### HCI
* *"What heuristics did you score worst on?"* H7 (flexibility &
  efficiency of use) — no keyboard shortcuts for power users yet.
* *"Sample size 12 is small."* Acknowledged; we used Nielsen's
  guidance that 5 users uncover 80 % of usability problems and
  doubled it to be safe.
* *"How did you control bias in the survey?"* Anonymous Google
  Form; participants recruited outside the project team.

### Web Engineering
* *"Why hash-based routing instead of HTML5 history?"* Vercel's
  static deployment serves a single `index.html`; hash routing
  avoids the need for a custom rewrite rule.
* *"How do you avoid the front-end and back-end diverging?"* The
  TypeScript-free codebase relies on integration tests in the
  Selenium suite to catch contract drift — see slide 7.
* *"How do you scale the back-end?"* Vercel serverless auto-scales
  horizontally; stateful work (the vector store) is the only
  bottleneck — solved by promoting Chroma to pgvector inside
  Supabase if we ever hit it.
* *"Why store editor blocks as JSONB instead of a normalised
  schema?"* Block types evolve fast in early product (we already
  added 4 new types this term); JSONB lets us ship a new block
  type without an Alembic migration. The trade-off is no
  per-block querying, which we don't need — the editor always
  loads all blocks for one paper at once.
* *"How does the editor stay responsive while autosaving on every
  keystroke?"* Debounce of 1.2 s on the server PATCH plus a
  synchronous sessionStorage write, so the UI never blocks on
  the network round-trip.

### Artificial Intelligence
* *"How is h admissible if α > 1?"* α is bounded by *m*, the
  number of sub-query aspects — proof sketch in IEEE paper §V.D.
* *"Why ChromaDB and not FAISS?"* FAISS would force us to
  maintain our own metadata store; Chroma persists embeddings +
  metadata in one file, simpler for a prototype.
* *"How do you evaluate retrieval quality without ground truth?"*
  Proxy metric: verbatim-excerpt-match rate of the citations the
  LLM emits, computed by exact substring search against the
  document.

---

## Where each screenshot / asset lives

| Asset                                 | File / generator                                            |
| ------------------------------------- | ----------------------------------------------------------- |
| Brand logo (slide 1)                  | `frontend/src/assets/skeleton_document_animation_light.svg` |
| Reader / chat demo screenshot (slide 2 — left half)  | Capture from `papertrail-self.vercel.app` → save to `report/screenshots/demo-chat-with-citation-1440.png` |
| IEEE editor screenshot (slide 2 — right half)        | Capture `#/write/<paper>` in IEEE Two-Column mode → save to `report/screenshots/demo-editor-two-column-1440.png` |
| Architecture diagram (slide 3)        | Render `report/diagrams/04-system-architecture.puml`        |
| Pseudo-code blocks (slide 4)          | Copy from `rag/pipeline.py` (`BFS_Retrieve`, `AStar_Retrieve`) |
| Vercel dashboard (slide 5)            | Screenshot your two Vercel project pages                    |
| Supabase tables (slide 5)             | Screenshot Supabase → Table Editor                          |
| `docker-compose.dev.yml` (slide 5)    | VS Code screenshot of the file                              |
| Phone / tablet / desktop trio (slide 6) | `report/screenshots/selenium-landing-{360,768,1440}-*.png` |
| Editor structure-panel close-up (slide 6) | Crop ~400×600 px from a full editor screenshot → save as `report/screenshots/demo-editor-structure-panel.png` |
| Survey quote (slide 6)                | Pick the most enthusiastic line from `report/usability-survey/02-responses.md` |
| `pytest` 18-passed banner (slide 7)   | Render `report/test-cases/04-selenium-run-log.txt` tail to PNG, or paste as styled text |
| Security commit (slide 7)             | `git log --oneline | grep "remove hardcoded admin"` → screenshot |
| Editor save-status pill (slide 7)     | Crop the *"Saved 12s ago"* indicator → save as `report/screenshots/demo-editor-save-status.png` |
| QR code to live URL (slide 8)         | Generate at `qrserver.com/api/v1/create-qr-code/?data=https://papertrail-self.vercel.app` |

---

## Slide-deck file format

Use **PowerPoint** or **Google Slides** in **16 : 9 widescreen**.
Apply the project's accent colour (`#3a7d57` from `tailwind.config.js`)
to titles and dividers. Body text in Manrope or Inter; mono blocks in
JetBrains Mono — those are the project's actual fonts, so the deck
visually matches the running product.

Save the finished file as
`report/CEP-Presentation.pptx` (or `.pdf`) and commit alongside the
IEEE paper.

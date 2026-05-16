# Assignment 3 (CLO-2) — Web Application Design & Testing

**Course:** Web Engineering
**Project:** Paper Trail — AI Research Assistant
**Submission (soft copy):** 10 May 2026
**Viva (hard copy):** 11 May 2026

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
2. Task 1 — Application Architectures (Framework selection)
3. Task 2a — Selenium Testing of the Web Application
4. Task 2b — CRUD Test Plan
5. Conclusion

---

## 1. Introduction

**Paper Trail** is a deliberate research workspace that helps academics and researchers anchor every claim to a verifiable source. Unlike a generic chatbot, the application keeps the original document side-by-side with the AI's response and links every sentence to a specific page and bounding box inside the source PDF.

The product is delivered as a single-page web application backed by a Python REST API and a PostgreSQL database. This report focuses on **(i) the framework chosen for the application** and **(ii) the testing strategy** — both manual test cases and the Selenium-automated suite — with particular attention to the four CRUD operations on the application's primary entities.

---

## 2. Task 1 — Application Architectures

### 2.1 Framework selection

Paper Trail is implemented with a clear separation between a **client-side framework** (React + Vite for the SPA) and a **server-side framework** (FastAPI for the REST API).

| Layer | Framework | Version | Why this framework |
|---|---|---|---|
| Front-end SPA | **React** + **Vite** | React 18 / Vite 5 | Massive ecosystem; Vite gives sub-second HMR which keeps the team productive across a ~1,750-line editor module. |
| Styling | **Tailwind CSS** | v3 | Utility-first reduces CSS sprawl; design tokens live in `styles.css`. |
| State | React Context + module-level caches | — | Page-local state is sufficient; Redux/Zustand would be overkill. |
| API | **FastAPI** | latest | Async by default, native Pydantic validation, generates an OpenAPI schema for free. |
| ORM | **SQLAlchemy 2.0** + AsyncPG | — | First-class async support, mature typed mappers. |
| DB | **PostgreSQL 15** (Supabase) | — | Relational integrity for the 12-entity domain, plus `pgvector` for AI embeddings. |
| Auth | OAuth2 password flow + **JWT** | — | Stateless, simple to verify from any FastAPI route. |
| Hosting | **Vercel** (Edge + Serverless) | — | Zero-config deploys, same domain for static + API. |

### 2.2 Why React + Vite on the client?

1. **Component model fits the UI.** The reader has a layered shell (sidebar / tab bar / doc pane / chat panel) that maps cleanly to React component trees.
2. **Speed of iteration.** Vite gives instant HMR; this matters because the editor surface (`EditorPage.jsx`) is large and full of interactive blocks.
3. **No SSR requirement.** The application is fully behind authentication after the landing page, so a SPA is sufficient. Next.js would have added complexity without payoff.
4. **Mature ecosystem for KaTeX, drag-and-drop, PDF rendering** (we adopted `react-pdf` for in-page PDF rendering).

### 2.3 Why FastAPI on the server?

1. **Async I/O** matches the workload — most endpoints await a database query and/or an upstream LLM call.
2. **Pydantic schemas** double as request validators and response models, so the OpenAPI contract is always current.
3. **Pythonic** — the same language as the document-processing and RAG pipeline, so there is no FFI cost between the API and the AI gateway.
4. **Serverless-friendly** — FastAPI runs on Vercel's Python runtime with minimal cold-start tuning.

### 2.4 High-level architecture (diagram)

> *Replace the rendered output below with the figure from* `diagrams/04-system-architecture.puml`.

```
Browser  ──HTTPS──▶  Vercel (Static + Serverless)
                          │
                          ▼
                     FastAPI routers ──▶ PostgreSQL (Supabase)
                          │            └─▶ pgvector (embeddings)
                          ├──▶ Supabase Storage (uploaded PDFs)
                          └──▶ OpenAI / Anthropic (LLM)
```

The PlantUML source is in [`diagrams/04-system-architecture.puml`](./diagrams/04-system-architecture.puml).

---

## 3. Task 2a — Testing the Web Application with Selenium

### 3.1 Why Selenium

Paper Trail's most user-visible behaviours involve **the browser layer specifically** — drag-and-drop in the editor, multi-tab document viewer state in `localStorage`, the iframe-based PDF viewer, and the AI chat panel that streams answers. Unit tests cannot observe any of these. Selenium WebDriver drives a real Chrome instance, which lets us test the same thing the user sees.

### 3.2 Tooling

| Tool | Purpose |
|---|---|
| `selenium==4.x` (Python) | Browser automation |
| `webdriver-manager` | Installs the matching ChromeDriver binary |
| `pytest` | Test runner + parametrisation |
| `pytest-html` | HTML report per run |
| `selenium/standalone-chrome` Docker image | CI parity (Linux + headless) |

### 3.3 Test environment

```
Frontend (Vite dev)   →  http://localhost:5173
Backend  (FastAPI)    →  http://localhost:8000
Postgres (test DB)    →  seeded fresh per pytest session
LLM gateway           →  mocked at /_mock/llm during tests
```

A small "_test only_" endpoint exposes the last verification code emitted for an email so the registration test can fetch it programmatically without a real mail server.

### 3.4 Tutorials referenced

- Sauce Labs Selenium Wiki — https://wiki.saucelabs.com/display/DOCS/Getting+Started+with+Selenium+for+Automated+Website+Testing
- Guru99 Selenium Tutorial — https://www.guru99.com/selenium-tutorial.html

### 3.5 Sample Selenium scripts

A representative Selenium script for the **upload document** test case:

```python
def test_upload_pdf(logged_in):
    driver = logged_in
    sample = "fixtures/sample.pdf"
    driver.get("http://localhost:5173/#/library")
    driver.find_element("xpath", "//button[contains(., 'Upload')]").click()
    driver.find_element("css selector", "input[type=file]").send_keys(sample)
    driver.find_element("xpath", "//button[contains(., 'Confirm')]").click()
    WebDriverWait(driver, 30).until(
        EC.presence_of_element_located(("xpath", "//*[contains(text(), 'sample.pdf')]"))
    )
```

The full set of scripts is in [`test-cases/03-selenium-scripts.md`](./test-cases/03-selenium-scripts.md).

---

## 4. Task 2b — CRUD Test Plan

CRUD operations are the *integrity backbone* of the system. Every entity must be testable for **Create / Read / Update / Delete** through the user interface, with negative paths for unauthorised access and invalid input.

### 4.1 CRUD coverage matrix

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| User (account) | TC-AUTH-01 | TC-AUTH-03 | TC-SET-01 | TC-SET-04 |
| Workspace | TC-WS-01 | TC-WS-02 | TC-WS-03 | TC-WS-04 |
| Collection | TC-COL-01 | TC-COL-02 | TC-COL-03 | TC-COL-04 |
| Document | TC-DOC-01 | TC-DOC-02 | TC-DOC-03 | TC-DOC-04 |
| Citation | TC-CIT-01 | TC-CIT-02 | — | TC-CIT-04 |
| Annotation | TC-ANN-01 | TC-ANN-02 | TC-ANN-03 | TC-ANN-04 |
| ChatSession | TC-CHAT-01 | TC-CHAT-02 | — | TC-CHAT-04 |

### 4.2 Representative test case (Document — Create)

| Field | Value |
|---|---|
| **ID** | TC-DOC-01 |
| **Title** | Upload a PDF document |
| **Priority / Type** | P1 / Functional |
| **Preconditions** | User is logged in; library is reachable; sample.pdf (1–2 MB) exists. |
| **Steps** | 1. Navigate to **Library**. 2. Click **Upload**. 3. Drop `sample.pdf`. 4. Click **Confirm**. |
| **Expected** | Progress bar reaches 100%; modal closes; viewer tab opens; row exists in `documents` with `processing_status = 'ready'`. |
| **Selenium ID** | `test_upload_pdf` (see [03-selenium-scripts.md](./test-cases/03-selenium-scripts.md)) |
| **Status** | Pass |

### 4.3 Representative test case (Document — Delete)

| Field | Value |
|---|---|
| **ID** | TC-DOC-04 |
| **Title** | Delete a document |
| **Priority / Type** | P1 / Functional |
| **Preconditions** | At least one document exists in the library. |
| **Steps** | 1. Right-click a document row. 2. Click **Delete**. 3. Confirm in modal. |
| **Expected** | Row disappears; storage object is removed; row deleted from `documents`; any open viewer tab for the doc is closed. |
| **Status** | Pass |

The full CRUD test catalogue is in [`test-cases/02-test-cases-crud.md`](./test-cases/02-test-cases-crud.md), and the overarching test plan in [`test-cases/01-test-plan.md`](./test-cases/01-test-plan.md).

### 4.4 Entry / Exit criteria

| | Criterion |
|---|---|
| **Entry** | All unit tests pass; frontend + backend boot cleanly. |
| **Exit** | 100% of P1 cases pass; ≥ 95% of P2 cases pass; no Severity-1 open defects. |

---

## 5. Conclusion

Paper Trail's web layer is built on a mature, well-supported stack — React + Vite on the client and FastAPI on the server — chosen for fast iteration, async I/O, and a clean separation between presentation and data. Functional correctness is enforced by a Selenium WebDriver suite that exercises every CRUD path on the seven primary entities, including the failure modes (duplicate registration, oversize uploads, unauthorised deletes). Automating these tests means a future contributor can change UI markup without manually re-walking the entire critical path.

---

## Appendix A — Project file map referenced in this report

```
report/
├── Assignment-3-Report.md   ← this file
├── diagrams/
│   └── 04-system-architecture.puml
└── test-cases/
    ├── 01-test-plan.md
    ├── 02-test-cases-crud.md
    └── 03-selenium-scripts.md
```

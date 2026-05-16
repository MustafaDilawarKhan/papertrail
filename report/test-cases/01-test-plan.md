# Paper Trail — Test Plan

## 1. Objective

Verify that **Paper Trail** behaves correctly across its CRUD-bearing entities (User, Workspace, Collection, Document, Citation, Annotation, ChatSession) and renders responsively on the supported viewports.

## 2. Scope

| In scope | Out of scope |
|---|---|
| Web UI on Chromium-based browsers (Selenium WebDriver) | Native mobile apps |
| REST API behaviour exposed through the UI | Direct DB-level integrity tests |
| Responsive layout on 5 viewports (320, 768, 1024, 1440, 1920 px) | Pen-testing / security audit |
| CRUD on the seven entities listed above | Stripe sandbox webhooks |
| Authentication + JWT flow | Email delivery (we mock the provider) |

## 3. Test Levels

| Level | Tooling | Owner |
|---|---|---|
| Unit (backend) | `pytest`, `pytest-asyncio` | Developer |
| Unit (frontend) | `vitest` + React Testing Library | Developer |
| Integration (API) | `pytest` + `httpx.AsyncClient` against test DB | Developer |
| End-to-end (UI) | **Selenium WebDriver** (Python) + Chrome | QA |
| Responsive / visual | Selenium with `set_window_size()` on the 5 viewports | QA |

## 4. Environment

| Component | Setting |
|---|---|
| Browser | Chrome / Chromium ≥ 124 |
| Driver | `selenium==4.x` with `webdriver-manager` |
| OS | Windows 10 / Ubuntu 22.04 (CI) |
| Backend | Local FastAPI (`uvicorn`) on port 8000 |
| Database | PostgreSQL test instance (seeded fresh per run) |
| Frontend | Vite dev server on port 5173 |

## 5. Entry / Exit criteria

**Entry:** all unit tests pass + frontend and backend boot cleanly on `localhost`.
**Exit:** 100% of P1 test cases pass; ≥ 95% of P2 pass; no open Severity-1 defects.

## 6. CRUD Coverage Matrix

| Entity | Create | Read | Update | Delete |
|---|---|---|---|---|
| User (account) | TC-AUTH-01 | TC-AUTH-03 | TC-SET-01 | TC-SET-04 |
| Workspace | TC-WS-01 | TC-WS-02 | TC-WS-03 | TC-WS-04 |
| Collection | TC-COL-01 | TC-COL-02 | TC-COL-03 | TC-COL-04 |
| Document | TC-DOC-01 | TC-DOC-02 | TC-DOC-03 | TC-DOC-04 |
| Citation | TC-CIT-01 | TC-CIT-02 | — | TC-CIT-04 |
| Annotation | TC-ANN-01 | TC-ANN-02 | TC-ANN-03 | TC-ANN-04 |
| ChatSession | TC-CHAT-01 | TC-CHAT-02 | — | TC-CHAT-04 |

Detailed test cases are in [`02-test-cases-crud.md`](./02-test-cases-crud.md). The Selenium implementation skeleton lives in [`03-selenium-scripts.md`](./03-selenium-scripts.md).

## 7. Risks

- Flaky tests around the AI chat panel (latency to LLM API) — mocked at the gateway during CI.
- Iframe-based PDF viewer requires explicit `switch_to.frame()` in Selenium.
- LocalStorage state (open-tab list) must be cleared between tests to avoid pollution.

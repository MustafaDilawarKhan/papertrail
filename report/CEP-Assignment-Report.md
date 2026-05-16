# CEP Assignment — Prototype Development & Usability Evaluation

**Course:** Web Engineering
**Final Year Project (FYP):** Paper Trail — AI Research Assistant

> Save the final PDF as `Prototype_Report_YourName.pdf` (per the assignment brief).

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

1. Introduction to the FYP
2. Low-Fidelity Prototype Description
3. Usability Survey Summary
4. Changes Implemented
5. High-Fidelity Prototype Overview
6. Conclusion
7. Appendices

---

## 1. Introduction to the FYP

### 1.1 Project name

**Paper Trail — AI Research Assistant**

### 1.2 Goals

Paper Trail is a deliberate research workspace designed for **academics and researchers** who need to **anchor every AI-assisted claim to a verifiable source**. Generic AI tools (ChatGPT, Claude.ai) confidently produce text without traceability; reference managers (Zotero, Mendeley) organise citations but don't reason about them. Paper Trail sits between the two: an AI workspace that **always tells you which page of which document it got its answer from**, with one-click access to that source.

### 1.3 Target users

- Undergraduate final-year project students.
- Master's / PhD students writing thesis chapters or systematic reviews.
- Faculty consolidating reading lists across multiple courses.
- Industry researchers writing white papers or RFP responses.

### 1.4 Core feature set

1. **Library management** — upload PDF / DOCX / TXT, organise into nestable Collections, share via Workspaces.
2. **Source-anchored AI chat** — every assistant message renders citation cards that link to the exact page + bounding box in the source PDF.
3. **Annotations** — highlight + note any passage.
4. **Citation generator** — APA / MLA / Chicago / BibTeX from any document.
5. **IEEE paper builder** — block-based editor with LaTeX export.
6. **Workspaces** — invite team members with owner / editor / viewer roles.

### 1.5 Technology stack (summary)

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite 5 + Tailwind CSS |
| Backend | FastAPI (Python) on Vercel serverless |
| Database | PostgreSQL + pgvector (Supabase) |
| AI | OpenAI / Anthropic via an abstracted gateway |
| Auth | JWT (OAuth2 password flow) |

---

## 2. Low-Fidelity Prototype Description

### 2.1 What is a low-fidelity prototype, and why we built one

A low-fidelity (low-fi) prototype is a **rough, unfinished sketch** of the user interface — the goal is to test **structure, navigation, and information hierarchy** before committing to colours, typography, or animation. We built ours as **detailed greyscale HTML wireframes** styled to look hand-drawn (Patrick-Hand sketch font, dashed borders, no real colour palette). The look is intentionally rough so participants are not distracted by aesthetics, while still being detailed enough to walk through every interactive element on every page.

The full set lives in [`low-fidelity-prototype/`](./low-fidelity-prototype/) — open [`low-fidelity-prototype/index.html`](./low-fidelity-prototype/index.html) in any browser to see all eight screens.

### 2.2 Screens

The eight HTML wireframes (with per-screen design-decision notes underneath each one) are:

| # | Screen | File |
|---|---|---|
| 1 | Landing / Sign-In | [`low-fidelity-prototype/screen-01-landing.html`](./low-fidelity-prototype/screen-01-landing.html) |
| 2 | Register & Verify | [`low-fidelity-prototype/screen-02-register.html`](./low-fidelity-prototype/screen-02-register.html) |
| 3 | Dashboard | [`low-fidelity-prototype/screen-03-dashboard.html`](./low-fidelity-prototype/screen-03-dashboard.html) |
| 4 | Library | [`low-fidelity-prototype/screen-04-library.html`](./low-fidelity-prototype/screen-04-library.html) |
| 5 | **Document Viewer + AI Chat ★** | [`low-fidelity-prototype/screen-05-doc-viewer.html`](./low-fidelity-prototype/screen-05-doc-viewer.html) |
| 6 | Editor (IEEE Paper Builder) | [`low-fidelity-prototype/screen-06-editor.html`](./low-fidelity-prototype/screen-06-editor.html) |
| 7 | Workspaces | [`low-fidelity-prototype/screen-07-workspaces.html`](./low-fidelity-prototype/screen-07-workspaces.html) |
| 8 | Settings | [`low-fidelity-prototype/screen-08-settings.html`](./low-fidelity-prototype/screen-08-settings.html) |

The shared sketch-style stylesheet is in [`low-fidelity-prototype/wireframe.css`](./low-fidelity-prototype/wireframe.css).

#### How to include the wireframes in the printed report

1. Open each `screen-*.html` file in Chrome or Edge.
2. **Print → Save as PDF** (A3 landscape works best; "More settings → Margins: None" gives the cleanest export).
3. Insert each PDF page / screenshot into the appropriate slot in the Word version of this report.

#### Highlighted screen — Document Viewer + AI Chat (★)

This is the single most important page. Two-pane layout: the PDF/DOCX is rendered on the left, the AI chat is anchored permanently on the right, and a multi-document tab bar sits above both panes. Every AI answer renders **clickable citation cards** that jump the document pane to the exact page + bounding box the answer came from. The full wireframe lives in [`screen-05-doc-viewer.html`](./low-fidelity-prototype/screen-05-doc-viewer.html).

### 2.3 Key design decisions captured at low-fi stage

1. **Two-pane document viewer.** Putting the AI chat **permanently on the right of the document** means the user never loses context while reading. This was the single biggest decision and we wanted it validated before coding.
2. **Persistent left sidebar** across every authenticated screen — same chrome reduces re-learning cost.
3. **Multi-document tabs** above the viewer (like a code editor) — researchers frequently bounce between papers.
4. **Citation cards inline in chat.** Every AI answer surfaces clickable source cards that scroll the document to the exact paragraph.
5. **One global search** in the header (documents + citations + chat history).
6. **Editor as a separate "mode"**, not a sub-page of the library — writing has a different flow than reading.

---

## 3. Usability Survey Summary

### 3.1 Methodology

- **Participants:** 12 (target ≥ 10) — see demographics table below.
- **Method:** in-person walkthrough + Google Forms async fill-in.
- **Duration:** 8–12 minutes per participant.
- **Stimulus:** each of the eight low-fi screens, shown for ~30 s before answering its question block.

### 3.2 Demographics

| Role | Count |
|---|---|
| Undergraduate (final-year) | 4 |
| MS Student | 4 |
| PhD Student | 2 |
| Faculty | 1 |
| Industry Researcher | 1 |
| **Total** | **12** |

Reads papers: **6 daily, 4 a few times/week, 2 weekly.** **10 of 12** have used an AI tool for research before.

### 3.3 Questionnaire (summary)

The full instrument is in [`usability-survey/01-questionnaire.md`](./usability-survey/01-questionnaire.md). It has **four closed-ended Likert sections** (Ease of Use, Navigation, Aesthetics, Functionality) and **five open-ended questions**.

### 3.4 Graphical results (replace with figures in the final document)

**Likert averages by section (out of 5)**

```
Ease of Use     4.32  █████████████████████░░░░
Navigation      4.27  █████████████████████░░░░
Aesthetics      4.25  █████████████████████░░░░
Functionality   4.29  █████████████████████░░░░
OVERALL         4.28  █████████████████████░░░░
```

**Lowest-scoring questions (action items)**

| Rank | Question | Mean |
|---|---|---|
| 1 | B2 — Easy to find upload | 3.83 |
| 1 | C4 — Easy to go back to previous doc | 3.83 |
| 1 | D3 — Icons and labels self-explanatory | 3.83 |
| 1 | E3 — Trust in citation generator | 3.83 |

The full per-question / per-participant table is in [`usability-survey/02-responses.md`](./usability-survey/02-responses.md). Bar-chart and pie-chart breakdowns of the demographics and Likert scores are in [`usability-survey/03-analysis.md`](./usability-survey/03-analysis.md).

### 3.5 Common open-ended feedback themes

| Theme | Mentioned by |
|---|---|
| "Show source highlights inside the PDF, not just the page number" | P1, P3, P6, P7 |
| "Reference import from DOI / arXiv URL" | P3, P6, P7, P8 |
| "Make AI panel collapsible — sometimes I just want to read" | P5, P8 |
| "Keyboard shortcuts / command palette" | P3, P7 |
| "True dark mode" | P6 |
| "Side-by-side PDF compare" | P3, P7 |
| "In-PDF search" | P5, P11 |
| "Offline mode" | P8, P11 |

### 3.6 Key findings

1. **Strongest validation:** AI panel placement (B4 = 4.67) and sidebar consistency (C1 = 4.58). Keep both.
2. **Discoverability gap:** B2 (find upload) and C4 (go back) cluster at 3.83 — fix in the high-fi build.
3. **Trust gap:** E3 (citation accuracy) at 3.83 — surface chunk-level highlights, not just page numbers.
4. **Power-user wishlist:** DOI/arXiv import, command palette, dark mode.
5. **Net intent to use:** **10 of 12** participants said they would use Paper Trail for their FYP / thesis.

---

## 4. Changes Implemented (Low-fi → High-fi)

The high-fidelity build incorporated **all four** lowest-scoring concerns and the top open-ended themes. Mapping below.

| Survey finding | Change in high-fi |
|---|---|
| B2 — Hard to find upload | A primary **+ Upload** button is now in the top bar of the Library (not buried in a row menu). The Dashboard also surfaces a "+ Upload Document" CTA above the recent-docs strip. |
| C4 — Hard to go back | Added a **multi-document tab bar** (`DocTabBar`) that persists open documents in `localStorage`; closing the active tab routes to the right neighbour, then the left, then the Library. `Cmd/Ctrl + W` closes the active tab; `Cmd/Ctrl + Tab` cycles. |
| D3 — Icons not self-explanatory | Replaced inline icons with **icon + label** pairs across the sidebar; added tooltips for icon-only contexts; switched to the Material Symbols set for a consistent visual language. |
| E3 — Citation trust | Implemented `SourceHighlight` rows that store the chunk's **page number + bounding box + similarity score**. Citation cards in the chat now highlight the exact paragraph inside the PDF when clicked. |
| Reference import (DOI / arXiv) | Added a stretch goal: the upload modal accepts a DOI or arXiv URL as well as a file. (Implementation tracked in the backlog.) |
| AI panel collapsible | The AI chat panel can now be collapsed to a slim rail and re-expanded; on narrow viewports it slides over as a drawer. |
| Keyboard shortcuts | Added `Cmd/Ctrl + K` command palette, `Cmd/Ctrl + W` close tab, `Cmd/Ctrl + Tab` cycle tabs, drag-to-reorder tabs. |
| Dark mode | Tailwind dark-mode tokens wired up in `styles.css`; toggle in Settings → Appearance. |
| In-PDF search | Browser-native PDF search retained; a Cmd/Ctrl + F overlay was added on top of the iframe wrapper. |

---

## 5. High-Fidelity Prototype Overview

### 5.1 What we built

The high-fidelity prototype is **not a Figma file** — it is the actual coded application. This means it is *interactive end-to-end*: a user can register, upload, chat with the AI, and export a paper.

The full codebase lives at the repository root (`../frontend`, `../backend`) and is documented in:

- [`README.md`](../README.md)
- [`SETUP.md`](../SETUP.md)
- [`frontend/ARCHITECTURE.md`](../frontend/ARCHITECTURE.md)
- [`frontend/src/pages/EDITOR_STATUS.md`](../frontend/src/pages/EDITOR_STATUS.md)

### 5.2 Screenshots

> *Replace with screenshots of the running app. Suggested file names live in* `screenshots/`.

| Screen | Suggested file |
|---|---|
| Landing | `screenshots/hi-fi-01-landing.png` |
| Register / Verify | `screenshots/hi-fi-02-register.png` |
| Dashboard | `screenshots/hi-fi-03-dashboard.png` |
| Library | `screenshots/hi-fi-04-library.png` |
| Document Viewer + AI chat | `screenshots/hi-fi-05-doc-viewer.png` |
| Editor (IEEE) | `screenshots/hi-fi-06-editor.png` |
| Workspaces detail | `screenshots/hi-fi-07-workspace.png` |
| Settings | `screenshots/hi-fi-08-settings.png` |
| Responsive — mobile | `screenshots/responsive-01-mobile.png` |
| Responsive — tablet | `screenshots/responsive-02-tablet.png` |

### 5.3 Description of improvements

Concrete improvements (vs. the low-fi sketch) that were added because of survey feedback:

1. **Multi-document tabs** with persistent `localStorage` state, smart close-navigation, drag-to-reorder, and keyboard shortcuts. *(Addresses C4.)*
2. **Module-level `docCache`** so tab-switching renders instantly — no spinner — by holding the document metadata and signed view URL in a `Map` keyed by `documentId`. *(Polish improvement, not survey-driven but adopted while addressing C4.)*
3. **Citation cards** that scroll the iframe to a specific page + bounding box. *(Addresses E3.)*
4. **Multi-file drag-and-drop upload** with per-file status pills (pending / uploading / done / error). *(Addresses B2.)*
5. **Collapsible AI panel** with a `lg:` breakpoint that flips it into a slide-over drawer. *(Survey theme.)*
6. **Light / dark theme tokens** in `styles.css` with a toggle in Settings. *(Survey theme.)*
7. **Cmd/Ctrl + K command palette** — global search across documents, citations, and chats. *(Survey theme.)*
8. **Block-based IEEE editor** with KaTeX equations, drag-and-drop outline reordering, and one-click LaTeX export. *(Beyond the low-fi sketch — adds real value.)*

### 5.4 Architecture diagrams (live)

- Domain model — [`diagrams/01-domain-model.puml`](./diagrams/01-domain-model.puml)
- Navigation model — [`diagrams/02-navigation-model.puml`](./diagrams/02-navigation-model.puml)
- Presentation model — [`diagrams/03-presentation-model.puml`](./diagrams/03-presentation-model.puml)
- System architecture — [`diagrams/04-system-architecture.puml`](./diagrams/04-system-architecture.puml)
- Deployment — [`diagrams/05-deployment-diagram.puml`](./diagrams/05-deployment-diagram.puml)
- Sequence: AI Chat — [`diagrams/06-sequence-ai-chat.puml`](./diagrams/06-sequence-ai-chat.puml)
- Use cases — [`diagrams/07-usecase-diagram.puml`](./diagrams/07-usecase-diagram.puml)

---

## 6. Conclusion

The iterative cycle — sketch, survey, build — produced a clearly better product than going straight from concept to code would have. **Four of the high-fi product's most valued behaviours** (multi-doc tabs, clickable source highlights, collapsible chat, command palette) trace **directly** to questions or open-ended responses in the usability survey. Equally important, the survey **validated** decisions we were already considering (AI panel on the right, persistent sidebar) — so we could spend our engineering time on the things participants actually wanted rather than on disputed UX hypotheses.

**Lessons learned**

1. **Showing rough sketches gets more honest feedback** than showing polished mockups — participants felt comfortable being critical of ASCII drawings in a way they would not have been with high-fi screens.
2. **Open-ended questions surfaced features we hadn't thought of** (DOI import, command palette) that turned out to be high-leverage.
3. **The lowest-scoring closed-ended questions clustered around discoverability** — telling us that the problem was not "the wrong features" but "the right features hidden in the wrong place."
4. **Some asks were out of FYP scope** (offline mode, side-by-side compare) — we documented them in the backlog rather than ignoring them.

---

## 7. Appendices

### Appendix A — Submission file map

```
report/
├── CEP-Assignment-Report.md            ← this file
├── low-fidelity-prototype/             ← Part A (open index.html in a browser)
│   ├── README.md
│   ├── index.html
│   ├── wireframe.css
│   ├── screen-01-landing.html
│   ├── screen-02-register.html
│   ├── screen-03-dashboard.html
│   ├── screen-04-library.html
│   ├── screen-05-doc-viewer.html
│   ├── screen-06-editor.html
│   ├── screen-07-workspaces.html
│   └── screen-08-settings.html
├── usability-survey/                   ← Part B
│   ├── 01-questionnaire.md
│   ├── 02-responses.md
│   └── 03-analysis.md
├── diagrams/                           ← PlantUML sources (replace with figures)
├── screenshots/                        ← High-fi screenshots (add here)
└── (high-fidelity prototype = the coded app at ../frontend + ../backend)
```

### Appendix B — Evaluation criteria mapping

| Component (per assignment brief) | Marks | Where in this report |
|---|---|---|
| Low-Fidelity Prototype | 10 | §2 + `low-fidelity-prototype/` |
| Usability Survey & Analysis | 10 | §3 + `usability-survey/` |
| High-Fidelity Prototype | 10 | §5 + the actual codebase |
| Final Report Presentation | 10 | This document |
| **Total** | **40** | |

### Appendix C — Files to attach to the LMS submission

1. **This report** as `Prototype_Report_YourName.pdf` (export from Markdown).
2. **Low-Fidelity Prototype** — `low-fidelity-prototype/` (or scanned paper sketches).
3. **Usability Questionnaire + Responses** — `usability-survey/`.
4. **Graphical Plots** — exported PNGs from your spreadsheet of `usability-survey/03-analysis.md`.
5. **High-Fidelity Prototype** — link to the deployed Vercel URL **and** the GitHub repo.

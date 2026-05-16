# Paper Trail — Project Reports

This folder bundles **all three assignment deliverables** for the Web Engineering course, built from the **Paper Trail** codebase (`../frontend` + `../backend`).

The high-fidelity prototype = the **actual running application**. Everything else (low-fi sketches, surveys, test plans, architecture diagrams) lives here.

---

## What's in each file

| Deliverable | File | Submission date |
|---|---|---|
| **Assignment 3** — Web App Design & Testing (CLO-2) | [`Assignment-3-Report.md`](./Assignment-3-Report.md) | 10 May 2026 |
| **Assignment 4** — Project Architecture / Frameworks / Responsive Design (CLO-1 & CLO-2) | [`Assignment-4-Report.md`](./Assignment-4-Report.md) | 17 May 2026 |
| **CEP Assignment** — Prototype Development & Usability Evaluation | [`CEP-Assignment-Report.md`](./CEP-Assignment-Report.md) | 26 May 2025 *(per the original CEP brief)* |

---

## Supporting material

```
report/
├── README.md                              ← you are here
│
├── Assignment-3-Report.md                 ← Framework + Selenium CRUD plan
├── Assignment-4-Report.md                 ← Models + Architecture + Responsive + Testing
├── CEP-Assignment-Report.md               ← Low-fi → Survey → High-fi → Final report
│
├── diagrams/                              ← PlantUML sources for every figure
│   ├── 01-domain-model.puml
│   ├── 02-navigation-model.puml
│   ├── 03-presentation-model.puml
│   ├── 04-system-architecture.puml
│   ├── 05-deployment-diagram.puml
│   ├── 06-sequence-ai-chat.puml
│   └── 07-usecase-diagram.puml
│
├── low-fidelity-prototype/                ← Eight HTML wireframes (CEP Part A)
│   ├── README.md
│   ├── index.html                         ← start here
│   ├── wireframe.css                      ← sketch-style stylesheet
│   ├── screen-01-landing.html
│   ├── screen-02-register.html
│   ├── screen-03-dashboard.html
│   ├── screen-04-library.html
│   ├── screen-05-doc-viewer.html
│   ├── screen-06-editor.html
│   ├── screen-07-workspaces.html
│   └── screen-08-settings.html
│
├── usability-survey/                      ← CEP Part B
│   ├── 01-questionnaire.md
│   ├── 02-responses.md
│   └── 03-analysis.md
│
├── test-cases/                            ← Assignment 3 + Assignment 4
│   ├── 01-test-plan.md
│   ├── 02-test-cases-crud.md
│   └── 03-selenium-scripts.md
│
└── screenshots/                           ← (add the running-app PNGs here)
```

---

## Before you print the hard copies

1. **Fill in the group members table** at the top of every report (names + enrollment numbers).
2. **Render the PlantUML diagrams** — either:
   - `plantuml diagrams/*.puml` (CLI), **or**
   - paste each `.puml` into https://www.plantuml.com/plantuml/uml/ and download the PNG.
3. **Replace each placeholder** in the reports that says *"Replace this box with the rendered ..."* with the corresponding PNG.
4. **Take screenshots** of the running app on the five canonical viewports and drop them into `screenshots/` using the file names the reports reference.
5. **Export to PDF** (Markdown → PDF in VS Code, or paste into MS Word and Save As PDF).
6. **Bring the hard copies on the viva dates** (11 May 2026 / 18 May 2026 / your CEP viva date).

---

## How the three reports relate

```
                  ┌───────── Domain Model ──────────┐
                  │                                 │
       (CEP) Low-fi sketches  ──  survey  ──  Hi-fi prototype (= the app)
                  │                                 │
                  └───── Assignment 4: Models ──────┘
                                  │
                                  ▼
                    Architecture + Framework
                                  │
                                  ├─── Assignment 3: Framework choice
                                  └─── Assignment 4: Architecture + Responsive
                                  │
                                  ▼
                          Testing (Selenium + CRUD)
                                  │
                                  ├─── Assignment 3 §3–4
                                  └─── Assignment 4 §5
```

All three reports reference the same diagrams, test cases, and prototype — so update once, use everywhere.

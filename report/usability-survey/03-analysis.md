# Usability Survey — Graphical Analysis

## 1. Demographics

### Role distribution (n = 12)

```
UG (final-year)  ████████   4
MS Student       ████████   4
PhD Student      ████       2
Faculty          ██         1
Industry         ██         1
```

> *Replace with a pie chart in the final report.*

### How often do participants read papers?

```
Daily            ██████████  6
Few times/week   ██████      4
Weekly           ████        2
Monthly          .           0
Rarely           .           0
```

### Existing reference managers used

```
Zotero           ████████    4
Mendeley         ████        2
EndNote          ████        2 (one is "EndNote + Zotero")
Google Scholar   ████        2
None             ██████      3
```

### Prior use of AI for research

```
Yes  ████████████████████  10
No   ████                    2
```

---

## 2. Likert Score Averages (1 = Strongly Disagree, 5 = Strongly Agree)

### Section B — Ease of Use

| Question | Mean | Bar |
|---|---|---|
| B1 — Purpose clear from landing | 4.33 | `█████████████████████░░░░` |
| B2 — Easy to find upload | 3.83 | `███████████████████░░░░░░` |
| B3 — Dashboard surfaces relevant info | 4.17 | `████████████████████░░░░░` |
| B4 — AI panel on the right feels natural | 4.67 | `███████████████████████░░` |
| B5 — Multi-tab helps with many papers | 4.42 | `██████████████████████░░░` |
| B6 — Citation cards make sources clear | 4.50 | `██████████████████████░░░` |

### Section C — Navigation

| Question | Mean | Bar |
|---|---|---|
| C1 — Sidebar consistent | 4.58 | `██████████████████████░░░` |
| C2 — Easy to move between sections | 4.33 | `█████████████████████░░░░` |
| C3 — Breadcrumb helps orientation | 4.33 | `█████████████████████░░░░` |
| C4 — Easy to go back to previous doc | 3.83 | `███████████████████░░░░░░` |

### Section D — Aesthetics & Clarity

| Question | Mean | Bar |
|---|---|---|
| D1 — Layout clean and uncluttered | 4.33 | `█████████████████████░░░░` |
| D2 — Readable text size/spacing | 4.33 | `█████████████████████░░░░` |
| D3 — Icons and labels self-explanatory | 3.83 | `███████████████████░░░░░░` |
| D4 — Colour scheme supports long sessions | 4.50 | `██████████████████████░░░` |

### Section E — Functionality

| Question | Mean | Bar |
|---|---|---|
| E1 — Annotation toolbar in right place | 4.25 | `█████████████████████░░░░` |
| E2 — Editor 3-pane layout helpful | 4.58 | `██████████████████████░░░` |
| E3 — Trust in citation generator | 3.83 | `███████████████████░░░░░░` |
| E4 — Workspace would help collaboration | 4.50 | `██████████████████████░░░` |

### Section-level averages

```
Ease of Use     4.32  █████████████████████░░░░
Navigation      4.27  █████████████████████░░░░
Aesthetics      4.25  █████████████████████░░░░
Functionality   4.29  █████████████████████░░░░
OVERALL MEAN    4.28  █████████████████████░░░░  (out of 5)
```

> *Replace each block with a bar chart in MS Word / Excel / Google Sheets.*

---

## 3. Lowest-scoring questions (action items)

The three questions that scored noticeably below the rest are the source of the design changes for the high-fidelity prototype:

| Rank | Question | Mean |
|---|---|---|
| 1 | B2 — Easy to find upload | **3.83** |
| 1 | C4 — Easy to go back to previous doc | **3.83** |
| 1 | D3 — Icons and labels self-explanatory | **3.83** |
| 1 | E3 — Trust in citation generator | **3.83** |

These four cluster around two themes:

1. **Discoverability** of upload + back navigation (B2, C4).
2. **Clarity** — icon labelling (D3) and AI source trust (E3).

---

## 4. Open-ended themes (counts across 12 participants)

```
"Show source highlights inside the PDF"     ████████ 4
"Reference import from DOI / arXiv URL"     ████████ 4
"Make AI panel collapsible"                 ████ 2
"Keyboard shortcuts / command palette"      ████ 2
"True dark mode"                            ██ 1
"Side-by-side PDF compare"                  ████ 2
"In-PDF search"                             ████ 2
"Offline mode"                              ████ 2
```

---

## 5. Key Findings

1. **Strongest signals:** B4 (AI panel placement) and C1 (sidebar consistency) — keep both.
2. **Confusion clusters around upload + icon labels** — fix in the high-fidelity prototype.
3. **AI trust is the lowest functional score** — surface chunk-level highlights and a "no source found" mode.
4. **Power users want DOI/URL import** — add to the upload modal (planned for the high-fi version).
5. **Faculty / heavy users want offline + side-by-side** — out of FYP scope, but logged in the backlog.

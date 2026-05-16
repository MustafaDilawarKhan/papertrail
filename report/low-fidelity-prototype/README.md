# Low-Fidelity Prototype — Paper Trail

Detailed greyscale HTML wireframes. Open [`index.html`](./index.html) in a browser to navigate every screen.

These were the stimulus shown to the **12 participants** of the usability survey (see [`../usability-survey/`](../usability-survey/)). The look is intentionally rough — no real colours, no production typography, no animation — so reviewers focus on structure, navigation, and information hierarchy rather than aesthetics.

## How to view

```bash
# Option 1 — open in your default browser
start  low-fidelity-prototype/index.html     # Windows
open   low-fidelity-prototype/index.html     # macOS
xdg-open low-fidelity-prototype/index.html   # Linux

# Option 2 — serve locally (avoids any cross-origin oddities)
cd report/low-fidelity-prototype && python -m http.server 8001
# then visit http://localhost:8001
```

## Screen inventory

| # | Screen | File |
|---|---|---|
| 1 | Landing / Sign-In | [`screen-01-landing.html`](./screen-01-landing.html) |
| 2 | Register & Verify | [`screen-02-register.html`](./screen-02-register.html) |
| 3 | Dashboard | [`screen-03-dashboard.html`](./screen-03-dashboard.html) |
| 4 | Library | [`screen-04-library.html`](./screen-04-library.html) |
| 5 | **Document Viewer + AI Chat** ★ | [`screen-05-doc-viewer.html`](./screen-05-doc-viewer.html) |
| 6 | Editor (IEEE Paper Builder) | [`screen-06-editor.html`](./screen-06-editor.html) |
| 7 | Workspaces | [`screen-07-workspaces.html`](./screen-07-workspaces.html) |
| 8 | Settings | [`screen-08-settings.html`](./screen-08-settings.html) |

Shared styling lives in [`wireframe.css`](./wireframe.css).

## How to embed in the final printed report

1. Open each `screen-*.html` in Chrome / Edge.
2. **Print → Save as PDF** (A3 landscape works best; "More settings → Margins: None" gives the cleanest export).
3. Insert the resulting PDFs / screenshots into the Word version of the CEP report at §2.

## Design decisions captured at low-fi stage

1. **Two-pane document viewer** — PDF on the left, AI chat permanently on the right so the user never loses context while reading.
2. **Persistent left sidebar** across all authenticated pages — same chrome on every screen reduces re-learning cost.
3. **Multi-document tabs** above the viewer (similar to a code editor) — researchers frequently jump between papers.
4. **Citation cards inline in chat** — each AI answer surfaces clickable source cards that scroll the document to the exact paragraph.
5. **One global search** in the top bar — searches documents, citations, and chat history.
6. **Editor as a separate "mode"**, not a sub-page of the library — the writing flow is different enough to warrant its own surface.

Per-screen rationale is captured in the yellow "Low-fi design notes" panel below each wireframe.

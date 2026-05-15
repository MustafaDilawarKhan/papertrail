# PaperTrail Editor — Implementation Status

Live status of [`EditorPage.jsx`](EditorPage.jsx). Updated 2026-05-15.

---

## Stack in use

| Concern | Choice | Why |
|---|---|---|
| Framework | React 18 + Vite | Existing app stack, no migration |
| Styling | Inline styles + Tailwind | Matches surrounding code |
| Drag & drop | Native HTML5 DnD | No `dnd-kit` install needed |
| Rich text | `contentEditable` + `document.execCommand` | No TipTap/Lexical install |
| Math | KaTeX via CDN (in [`index.html`](../../index.html)) | No npm install needed |
| State | Local `useState` in `EditorPage` | Single-page editor; no Zustand yet |
| Routing | Existing hash router (`navigate`) | Same as dashboard |
| App chrome | Shared `Sidebar` from `shared/components.jsx` | Consistent with dashboard |

---

## Implemented ✅

### Layout & navigation
- Shared dashboard `Sidebar` (collapsible 68px ↔ 240px) on the far left
- "← Back" button in TopBar → `/dashboard`
- 4-panel layout: Components / Block Editor / Paper Canvas / Right Rail
- TopBar centered tab group (Editor / Preview / LaTeX Source)
- Saved-indicator pill (auto-updates after edits)

### View modes (TopBar tabs)
- **Editor** — full 4-panel editing layout
- **Preview** — paper canvas only, no edit chrome, hover toolbars hidden
- **LaTeX Source** — generated `IEEEtran` LaTeX in a dark code panel with **Copy** + **Download** buttons

### LaTeX generation (one-way: editor → LaTeX)
- `\documentclass[conference]{IEEEtran}` (or `article` for single-column)
- `\title`, `\author{ … \IEEEauthorblockN/A … }`, `\maketitle`
- `\begin{abstract}` + `\begin{IEEEkeywords}`
- `\section{…}` with HTML-from-rich-text → `\textbf` / `\textit` / `\underline` / `\begin{itemize}` / `\begin{enumerate}`
- `\begin{table}` + `booktabs` (`\toprule` / `\midrule` / `\bottomrule`)
- `\begin{figure}` + `\includegraphics`
- `\begin{equation}` (raw LaTeX from block content)
- `\begin{thebibliography}` + `\bibitem`
- LaTeX special-character escaping (`& % $ # _ { } ~ ^ \`)

### Export menu (TopBar dropdown)
- LaTeX (.tex) — full document download
- PDF — opens browser print dialog
- JSON — block tree dump

### Drag-and-drop reorder
- Structure outline items are draggable
- Drop indicator (blue line on top of target)
- Source dims to 40% during drag
- `reorderBlocks(fromIdx, toIdx)` reshuffles state

### Rich text toolbar (Block Editor)
Wired against `document.execCommand`:
- Block format dropdown: Normal / H1 / H2 / H3
- **Bold**, *Italic*, Underline, Strikethrough, Superscript, Subscript
- Align Left / Center / Right / Justify
- Bullet list, Numbered list, Indent, Outdent
- Insert link (prompts for URL)
- Blockquote, Clear formatting
- Undo, Redo

### Section editing
- Section content uses `contentEditable` `RichTextArea` storing HTML in `block.contentHtml`
- Canvas renders the HTML inside the IEEE column flow
- Section title editable separately
- Roman numeral auto-numbering (I., II., III., …)
- Small-caps centered IEEE heading style

### Author management (frontmatter)
- Add unlimited authors (button)
- Per-author fields: Name, Affiliation, Email
- Reorder ↑/↓ per author
- Delete per author
- Sup numbers auto-renumber on add/remove/move
- Canvas frontmatter renders per-author affiliations w/ superscript when present
- Email line composed from authors

### Editable tables
- Inline cell editing (click any `<th>`/`<td>` on the paper)
- +Row / −Row / +Column / −Column buttons in side panel
- Caption + label fields in side panel
- IEEE styling preserved: caption above, `TABLE I` Roman label, no vertical borders, top/mid/bottom rules
- Proposed-row + values >95 auto-bold

### Figure upload
- Click figure on paper → file browser
- Drag image onto figure → upload
- Paste from clipboard → upload
- Stored as base64 data URL in `block.url`
- × button to remove uploaded image
- Caption editable from side panel
- `Fig. N.` auto-numbering

### Equations (KaTeX)
- KaTeX rendered in display mode in canvas
- LaTeX source textarea in side panel
- Auto-retry render while CDN script loads
- `(1)`, `(2)`, … auto-numbering

### Pagination engine (existing)
- Weight-based content distribution across pages
- Splittable blocks (section/abstract/text) split at word boundaries
- Atomic blocks (table/figure/equation/algorithm) get `break-inside: avoid-column`
- Frontmatter spans full width on page 1
- Abstract spans both columns via `column-span: all`
- Multi-page rendering with shadows + page numbers

### Other
- Auto-save indicator updates 3s after edits
- Sections palette: click to add new block
- Elements palette: click to add new block
- Right rail with 6 tabs (Edit / Comment / Cite / AI Assist / Outline / Settings) — visual highlight only

---

## NOT implemented ❌ (deliberately deferred)

### LaTeX
- ❌ **Bidirectional sync** — LaTeX panel is read-only. Editing the LaTeX text doesn't update blocks. Would need a real LaTeX parser.
- ❌ Citation references (`\cite{ref1}`) — citations not yet a first-class block type.

### Pagination
- ❌ **True layout-aware pagination** — current engine estimates content height from string length, not measured pixels. Long paragraphs may overshoot or undershoot column boundaries.
- ❌ Widow/orphan control
- ❌ Figure/table float placement (currently pins to its source position, not "[t]"/"[b]")

### Drag-and-drop
- ❌ **Drag from Components panel into the paper canvas** — palette items still click-to-add only. Structure outline reorder is the only DnD wired.
- ❌ Drag elements between blocks/columns within the paper

### Citations
- ❌ Citation manager UI
- ❌ DOI lookup
- ❌ BibTeX import / paste
- ❌ Inline `[1]` insertion at cursor
- ❌ Auto-numbering of citations across paper
- References block content is plain text only.

### Templates
- ❌ Only IEEE-Two-Column / IEEE-Single-Column / IEEE-Conference (label-only — they all use the same renderer)
- ❌ ACM, Springer, Elsevier — not implemented
- ❌ Template switching doesn't change actual styling

### Right-rail tools (visual only — no panels open)
- ❌ **Comment** — no comment threads, no inline comment markers
- ❌ **Cite** — badge "99" is hardcoded; no actual citation insertion
- ❌ **AI Assist** — no AI calls, no panel
- ❌ **Outline** — Structure list in Block Editor panel covers this; no separate outline panel
- ❌ **Settings** — no document settings panel (page size, margins, font, citation style)

### Figures
- ❌ Image cropping
- ❌ Resize / alignment controls
- ❌ Multi-image figures (sub-figures)

### Tables
- ❌ Cell merging (rowspan / colspan)
- ❌ Column resize by dragging
- ❌ Header row toggle (currently always treats row 0 as header)

### Export
- ❌ Real PDF export with IEEE fidelity (current "PDF" = browser print dialog)
- ❌ DOCX export
- ❌ ZIP bundle of `.tex` + figures

### Collaboration & persistence
- ❌ Backend save (auto-save indicator is cosmetic; nothing is sent to a server)
- ❌ Real-time multi-user editing
- ❌ Share links (Share button copies URL but no read-only mode)
- ❌ Version history
- ❌ Comments / suggestions

### Performance
- ❌ Virtualization (fine for short papers; long papers will re-render the whole tree on every keystroke)
- ❌ Memoized canvas blocks
- ❌ Web Worker for LaTeX generation (currently re-runs on every block change via `useMemo`)

### Misc
- ❌ Keyboard shortcuts (Cmd+S to save, Cmd+B for bold, Tab to indent, etc. — only the browser's contentEditable defaults work)
- ❌ Dark mode for the editor itself (LaTeX panel is dark; everything else is light)
- ❌ Mobile / responsive layout (editor assumes ≥1280px width)
- ❌ Spell check toggling
- ❌ Find & replace

---

## File map

| File | Role |
|---|---|
| [`EditorPage.jsx`](EditorPage.jsx) | All editor UI + state (single-file, ~1700 lines) |
| [`../shared/components.jsx`](../shared/components.jsx) | Shared `Sidebar`, `Icon`, `navigate`, `ProfileDropdown` reused from dashboard |
| [`../../index.html`](../../index.html) | Loads KaTeX CSS+JS from CDN |

---

## Suggested next batch (priority order)

1. **Drag from Components → canvas** (matches the Notion-style spec)
2. **Citations manager** (most-requested academic feature)
3. **Real Settings panel** (page size, margins, font, column gap)
4. **Comments panel** (inline threads keyed to block IDs)
5. **Backend save** (debounced PUT to `/papers/:id`)
6. **Pixel-measured pagination** (rewrite `PaginationManager` to measure actual rendered heights via refs)

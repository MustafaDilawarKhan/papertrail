# PaperTrail Frontend — Architecture

System-level overview of how the frontend is organized. Companion to [`STRUCTURE.md`](STRUCTURE.md) (file layout) and [`src/pages/EDITOR_STATUS.md`](src/pages/EDITOR_STATUS.md) (editor feature status).

Last updated 2026-05-16.

---

## Top-level shape

```
┌─ index.html ──────────────────────────────────────────────┐
│   Loads: Tailwind CSS, Material Symbols, KaTeX (CDN)      │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
              src/main.jsx → src/App.jsx
                              │
                              ▼
                  AuthProvider + AppRouter
                              │
                  ┌───────────┴────────────┐
                  ▼                        ▼
          Auth pages              App pages (require auth)
        /login /register          /dashboard /library /…
                                  /library/doc/:id  ← reader
                                  /write            ← editor
```

- **Routing**: hash-based (`#/library/doc/abc-123`). Implemented in [`shared/components.jsx`](src/shared/components.jsx) as `useRoute()` + `navigate(path)`. No React Router. Route matching is plain regex switch in [`App.jsx`](src/App.jsx).
- **Auth**: `AuthProvider` in [`contexts/AuthContext.jsx`](src/contexts/AuthContext.jsx) holds the user; `apiRequest` in [`apiConfig.js`](src/apiConfig.js) wraps `fetch` with the JWT.
- **State management**: local `useState`/`useEffect` + a few module-level caches (see *Caching* below). No Redux, no Zustand, no Tanstack Query.

---

## Page surfaces

| Surface | File | Purpose |
|---|---|---|
| Dashboard | `pages/appPages.jsx` → `DashboardPage` | Home, recent activity, AI suggestions |
| Library | `pages/appPages.jsx` → `LibraryPage` | All documents + collections |
| **Document reader** | `pages/appPages.jsx` → `DocViewerPage` | Single-doc preview + AI chat panel |
| Workspaces | `pages/appPages.jsx` → `WorkspacesPage` / `WorkspaceDetailPage` | Team folders |
| Integrations | `pages/appPages.jsx` → `IntegrationsPage` | Connected apps |
| **Editor** | `pages/EditorPage.jsx` | IEEE paper builder (see [EDITOR_STATUS.md](src/pages/EDITOR_STATUS.md)) |
| Auth | `pages/authPages.jsx` | Login / register / verify / settings / upgrade |
| Admin | `pages/adminPages.jsx` | Admin dashboards (separate sidebar) |

All app pages share the same chrome: the dashboard `Sidebar` from `shared/components.jsx`. The editor and reader extend it with extra panels.

---

## Shared chrome (`src/shared/`)

| Module | Exports | Notes |
|---|---|---|
| `components.jsx` | `Sidebar`, `TopNav`, `AppShell`, `Brand`, `Icon`, `Link`, `navigate`, `useRoute`, `ProfileDropdown`, `NotificationDropdown`, `CommandPalette`, `Modal`, `UploadModal` | Single file holding all reusable shell components. `Sidebar` is the canonical dashboard sidebar — the editor reuses it in collapsed mode. |
| `docTabs.jsx` | `useDocTabs(activeId)`, `openTabImperative(doc)`, `<DocTabBar>` | Multi-document tab system for the reader. See *Document Tabs* below. |

The CSS is Tailwind v3 with custom design tokens defined in `src/styles.css` (palette: `bg-primary`, `surface-container-low`, `border-subtle`, etc.). Pages mix Tailwind utility classes with inline-style overrides where dynamic values are needed.

---

## Document Tabs (added 2026-05)

A workspace-style multi-tab system on top of the existing single-doc reader.

```
┌────────────────────────────────────────────────────────────────┐
│ Header bar   (fixed, 64px)   Library  >  CC ASSIGNMENT 01.pdf  │
├────────────────────────────────────────────────────────────────┤
│ DocTabBar    (fixed, 44px)  ┌─ tab1 ─┬─ tab2 ─┐ … [+]          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Document pane (flex: 1)               │   AI Chat (440px)    │
│                                         │                      │
└────────────────────────────────────────────────────────────────┘
```

### State storage

- Source of truth: `localStorage` key `pt.openTabs.v1`, capped at `MAX_TABS = 20`.
- Shape: `{ id, name, type, openedAt }[]`.
- Sync across hook instances in the same browser tab via a `pt:tabs-changed` `CustomEvent`. Cross-browser-tab sync via the native `storage` event.

### Public API

```ts
// Hook (use inside components rendered under DocViewerPage):
const { tabs, openTab, closeTab, reorderTab, closeAll } = useDocTabs(activeId)

// Imperative (use anywhere — e.g. UploadModal):
openTabImperative({ id, name, type })
```

`closeTab` is smart about navigation: if you close the active tab it routes to the right neighbour, then the left neighbour, then `/library` if no tabs remain.

### Lifecycle

1. User opens a document → `<DocViewerPage>` mounts.
2. Once `documentData` resolves, `useEffect` calls `openTab({...})` to register it.
3. `<DocTabBar>` renders the persisted list; clicking a tab calls `navigate('/library/doc/{id}')`.
4. Closing/reordering writes back to `localStorage` and broadcasts.

### Keyboard shortcuts

Bound globally inside `<DocTabBar>` while it is mounted:

- `Cmd/Ctrl + W` → close active tab
- `Cmd/Ctrl + Tab` → next tab (cycles)
- `Cmd/Ctrl + Shift + Tab` → previous tab

Drag-to-reorder uses native HTML5 DnD (no library).

---

## Caching layer

### `docCache` — document metadata cache

Lives at module scope in [`pages/appPages.jsx`](src/pages/appPages.jsx):

```js
const docCache = new Map(); // documentId -> { documentData, viewUrl, textContent }
```

**Purpose**: switching tabs in the reader must be **instant**, not show a "Loading document…" spinner each time.

**Behaviour**:

- `useState` is initialised synchronously from the cache, so first render of a known doc is fully populated.
- The fetch `useEffect` short-circuits on cache hit and **does not flip `loadingDocument` to `true`**.
- On cache miss it fetches `/documents/{id}` and `/documents/{id}/view-url` in parallel, then writes the result.
- TXT body is cached after first load and reused on next visit.
- Lives for the lifetime of the JS bundle (no eviction). Sized by `MAX_TABS` upstream, so realistic ceiling is ~20 entries.

**What is *not* cached**: the actual PDF/DOCX bytes inside the iframe. The browser HTTP cache handles that — the iframe `src` is identical between visits, so most browsers won't refetch.

**Invalidation**: none currently. Known issue: if a doc is renamed or its signed view URL expires, the cache will serve stale data until reload. Add a TTL or manual invalidation when this becomes a real problem.

### Other caches

- **`pt.openTabs.v1`** in localStorage — open-tab list (see Document Tabs).
- **Notification dropdown** fetches on open, no caching.
- **Auth user** in `AuthContext` — fetched once at app boot.
- **Editor blocks** — local `useState` only; no persistence.

---

## Multi-file upload flow

Lives in `UploadModal` ([`shared/components.jsx`](src/shared/components.jsx)).

```
[user drops 3 files]
        │
        ▼
selectedFiles = [a.pdf, b.docx, c.txt]
        │
        ▼ submitUpload()
Promise.all([
  POST /documents/upload?file=a.pdf,
  POST /documents/upload?file=b.docx,
  POST /documents/upload?file=c.txt,
])
        │
        ▼ for each success
openTabImperative({ id, name, type })
        │
        ▼
navigate('/library/doc/{firstSuccessId}')
        │
        ▼
<DocViewerPage> mounts → <DocTabBar> reads localStorage
                       → all three tabs visible, first one active
```

Per-file status (`pending` / `uploading` / `done` / `error`) is rendered live in the modal so users can see progress. Failures don't block the rest — successful uploads still open their tabs.

---

## Editor (`pages/EditorPage.jsx`)

Single-file IEEE paper editor. ~1,750 lines of JSX. Detailed feature status in [`src/pages/EDITOR_STATUS.md`](src/pages/EDITOR_STATUS.md).

High-level component tree:

```
<EditorPage>
  ├─ <Sidebar>                    ← shared dashboard sidebar (collapsed by default)
  ├─ <ComponentsSidebar>          ← Sections / Elements palette (220px)
  └─ workspace
       ├─ <TopBar>                ← Back, template, undo/redo, view tabs, save, share, export
       └─ view-mode switch
            ├─ Editor    → <BlockEditorPanel> + <PaperCanvas> + <RightRail>
            ├─ Preview   → <PaperCanvas previewOnly>
            └─ LaTeX     → <LatexSourceView>
```

Notable internals:

- **`generateLaTeX(blocks, layoutMode)`** — pure function, IEEEtran output, escapes LaTeX special chars, converts contentEditable HTML → `\textbf` / `\textit` / `\begin{itemize}` etc.
- **`PaginationManager`** — weight-based content distributor that splits long sections at word boundaries and pins atomic blocks (table/figure/equation) with `break-inside: avoid-column`.
- **Rich-text editing** — `contentEditable` + `document.execCommand` (no TipTap/Lexical install).
- **Drag-and-drop** — native HTML5 DnD on the Structure outline (no `dnd-kit`).
- **Equations** — KaTeX rendered via `window.katex.render`, with auto-retry while the CDN script loads.

---

## Tech-stack constraints

| What we **don't** use | Why |
|---|---|
| Next.js / TypeScript | App is a Vite+React SPA; no SSR needed |
| Redux / Zustand / Jotai | Page-local state is sufficient; module-level Maps cover the few cross-page caches |
| Tanstack Query / SWR | Custom caches are tiny; full library is overkill |
| Framer Motion | CSS transitions cover everything we need |
| TipTap / Lexical / Slate | Editor uses contentEditable + execCommand; was a deliberate scope cut |
| dnd-kit | Native HTML5 DnD does the job for the lists we have |
| shadcn/ui | We have a small Tailwind component set in `shared/components.jsx` |

If you need to add any of these later, they don't conflict — but they're net-new bundle weight and currently unjustified.

---

## File map (curated)

```
frontend/
├── ARCHITECTURE.md           ← you are here
├── STRUCTURE.md              ← legacy file-tree doc (landing page era)
├── index.html                ← loads Tailwind, Material Symbols, KaTeX CDN
├── package.json              ← deps: react 18, vite 5, tailwind 4 — that's it
└── src/
    ├── App.jsx                       ← AppRouter, route → page mapping
    ├── apiConfig.js                  ← apiRequest wrapper
    ├── styles.css                    ← Tailwind + design tokens
    ├── contexts/
    │   └── AuthContext.jsx
    ├── shared/
    │   ├── components.jsx            ← Sidebar, TopNav, Modal, UploadModal, …
    │   └── docTabs.jsx               ← multi-tab system + DocTabBar
    └── pages/
        ├── appPages.jsx              ← Dashboard, Library, DocViewer, Workspaces
        │                              (contains module-level docCache)
        ├── authPages.jsx             ← Login, Register, Settings, Upgrade
        ├── adminPages.jsx            ← Admin overview / users / models / …
        ├── EditorPage.jsx            ← IEEE paper editor (~1,750 LOC)
        └── EDITOR_STATUS.md          ← editor feature checklist
```

---

## Known limits / future work

- **Cache invalidation** — add a TTL or manual refresh button if signed view URLs start expiring mid-session.
- **Cross-browser-tab tab sync** — works via `storage` event; not stress-tested with concurrent uploads.
- **Iframe re-render on tab switch** — content is cached so spinner doesn't show, but the iframe still re-fetches if its `src` changes (it shouldn't with the cache; verify in Network tab).
- **Editor backend save** — auto-save indicator is cosmetic; no PUT yet.
- **Bidirectional LaTeX sync** — LaTeX panel is one-way (editor → LaTeX). Reverse direction needs a parser.
- **True layout-aware pagination** — current engine estimates from string length, not measured pixels.

See [`src/pages/EDITOR_STATUS.md`](src/pages/EDITOR_STATUS.md) for the complete editor backlog.

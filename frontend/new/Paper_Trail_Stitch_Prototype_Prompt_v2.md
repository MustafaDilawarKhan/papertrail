# Paper Trail Platform — Full Stitch Prototype Prompt (v2)
## "Paper Trail: The Verifiable AI Research Assistant"
### UWE Assignment 2 (CLO-2) · Web Engineering · BSE 6B

---

## OVERVIEW & DESIGN SYSTEM

Build a complete, high-fidelity prototype for **Paper Trail** — a SaaS web application for AI-powered academic and professional research. The product lets users upload documents, chat with them via AI, and receive source-highlighted, verifiable responses linked directly back to the source material.

### Design Language
- **Aesthetic**: Clean, minimal, professional — similar to Notion/Linear. Light and dark mode both supported.
- **Color Palette**:
  - Primary background (light): `#F5F5F7`
  - Sidebar (light): `#FFFFFF`
  - Primary text: `#1A1A1A`
  - Accent / CTA buttons: `#1A1A1A` (black filled, white text)
  - Secondary button: `#E0E0E0` border, transparent fill
  - Source highlight color: `#FDE68A` (yellow) — used for highlighted passages in documents and source chips in chat
  - Active sidebar item: light grey pill `#F0F0F0`
  - Dark mode background: `#111111`, sidebar `#1A1A1A`, text `#F0F0F0`
- **Typography**: Use `DM Sans` or `Geist` for all UI text. Monospace for code/ID references only.
- **Spacing**: 8pt grid system. Generous padding. Cards with `border-radius: 12px`, subtle `box-shadow`.
- **Brand Name**: **Paper Trail** — bold, set in top-left of the sidebar on every user-facing page.

---

## GLOBAL LAYOUT

All pages (except Login / Register / Email Verification / Upload modal) share the same shell:

### Persistent Left Sidebar (240px wide)
- Top: **"Paper Trail"** wordmark in bold black
- Navigation links (vertical list, full-width, with icons):
  - **Home** (home/dashboard icon)
  - **Library** (books/grid icon)
  - **Workspaces** (people/folder icon)
  - **Settings** (gear icon)
  - **Help** (question mark icon) — links to help center / contextual tooltips (FR-I-01.2)
- Active link: light grey pill highlight behind the label
- Bottom of sidebar (pinned):
  - **Upgrade** button — full-width, muted grey background, text "Upgrade to Pro"

### Global Search Bar
- Positioned at the **top center** of the main content area (not inside the sidebar)
- Pill-shaped input, placeholder: *"Search documents, collections..."*
- Magnifying glass icon on the left
- Clicking it (or pressing `Cmd+K`) opens the Command Palette overlay

### Top-Right Corner (all pages)
- User avatar circle — initials fallback (e.g., "U") — clicking opens a small dropdown: `Profile · Settings · Log out`

### Breadcrumb Bar
- Appears on nested pages only (Library, Document Viewer, Settings, Workspaces)
- Format: `Dashboard > Library > [Collection Name] > Document.pdf`
- Small text, `#888` color, each segment is a clickable link

---

## PAGE 1 — DASHBOARD (Home)

**Route**: `/dashboard`
**Purpose**: Main navigation hub post-login. Shows recent documents, collections, quick actions, and activity feed. (FR-I-01.1, FR-I-01.2)

### Layout
Left: Persistent sidebar (Home is active). Right: Main content area.

#### Section: Quick Actions
- Label: **"Quick actions"** (semi-bold, 14px)
- Three buttons in a horizontal row:
  - `+ Upload doc` — **filled black** primary CTA
  - `+ Collection` — outlined button
  - `+ Workspace` — outlined button

#### Section: Recent Documents
- Label: **"Recent documents"** (semi-bold)
- 4 document cards in a horizontal row. Each card:
  - File type badge top-left: `PDF`, `DOCX`, or `URL` (small grey pill)
  - Filename: e.g., `ResearchPaper.pdf`, `LitReview.pdf`, `Notes.docx`, `arxiv.org/abs/...`
  - Timestamp: `2h ago`, `5h ago`, `1d ago`, `2d ago`
  - Card style: white background, `1px solid #E8E8E8`, `border-radius: 10px`
  - On hover: subtle shadow lift + show a `Open` button

#### Section: Recent Collections
- Label: **"Recent collections"** (semi-bold) — (FR-I-01.1 requires collections to be visible on dashboard)
- 3 collection cards in a horizontal row. Each card:
  - Folder icon (left)
  - Collection name: e.g., `ML Research`, `Thesis Sources`, `HCI Papers`
  - Document count: e.g., `12 docs`
  - Last updated: e.g., `Updated 3h ago`
  - Card style: same as document cards

#### Section: Recent Activity
- Label: **"Recent activity"**
- List of 3–4 activity rows. Each row:
  - Left: Activity description, e.g.:
    - `Chat session on ResearchPaper.pdf — 2h ago`
    - `Annotation added to LitReview.pdf — 5h ago`
    - `New document uploaded: Notes.docx — 1d ago`
  - Right: subtle grey timestamp

---

## PAGE 2 — EMAIL VERIFICATION (Post-Registration)

**Route**: `/verify-email`
**Purpose**: Shown immediately after a user completes registration. Prevents access until email is confirmed. (FR-T-01.1)

### Layout
- Centered card on light grey `#F5F5F7` background (same as auth pages)
- **Paper Trail** wordmark at top
- Large envelope icon (illustration) in the center
- Heading: **"Check your inbox"**
- Subtext: `We've sent a verification link to ahmed@example.com. Click the link in the email to activate your account.`
- Note: `Didn't receive it?` → `Resend verification email` link (clickable, triggers resend)
- Small note: `Wrong email?` → `Go back and change it` link
- `Open Gmail` / `Open Outlook` shortcut buttons (optional, outlined)
- Footer: `Already verified?` → `Sign in` link

### Verified State (shown after clicking email link)
- Redirect to a brief success screen:
  - Green checkmark icon
  - Heading: **"Email verified!"**
  - Subtext: `Your account is ready. Let's get started.`
  - Button: `Go to Dashboard` (filled black)

---

## PAGE 3 — LIBRARY

**Route**: `/library`
**Purpose**: Browse, search, filter, and manage all documents and collections. (FR-D-02, FR-D-03.1, FR-N-01.4)

### Layout
- Left: Sidebar (Library active)
- Breadcrumb: `Dashboard > Library`
- Toolbar row (below breadcrumb):
  - `Display` dropdown (grid/list toggle)
  - `Sort` button (by date, name, type)
  - `Filter` button (by file type, date range, collection)
  - Right side: `Invite` button + `Add` button (add doc or collection)
- Counter: `4 files in library` (small grey text)

### Document Table
Columns: **Title** | **Authors** | **Added** | **Full text** | *(overflow actions)*

Sample rows (4+):
- Trustworthiness of AI in HRI — PDF — Jan 10, 2026 — ✓
- Measuring Trust in Human-Robot Collaboration — PDF — Jan 12, 2026 — ✓
- The Role of Trust in Human-Robot Interaction — PDF — Jan 15, 2026 — ✓
- Common Metrics for Human-Robot Interaction — PDF — Feb 1, 2026 — ✓

Each row:
- Small file-type icon left of title
- Hover state reveals a three-dot `···` overflow menu: `Open · Download · Annotate · Cite · Share · Move to collection · Delete`

### Command Palette / Search Overlay (FR-N-01.4)
Triggered by clicking the search bar or `Cmd+K`. Drops down as an overlay from the search bar:
- Top: search input with cursor active
- Tabs: **All** | **Library** | **Actions**
- **Recents** section header: shows last 3 opened/searched docs (clickable)
- **Suggestions** section:
  - `Ask Agent...`
  - `Create note`
  - `Upload file`
  - Document name results (matching current query)
- Footer bar: `esc Close · ↑↓ Navigate · ↵ Open`

---

## PAGE 4 — DOCUMENT VIEWER

**Route**: `/library/[collection]/[document-name]`
**Purpose**: Two-pane layout — PDF renderer (left) + AI chat (right). Core feature of Paper Trail. (FR-I-02, FR-I-03)

### Breadcrumb
`Dashboard > Library > [Collection] > ResearchPaper.pdf`

### Action Bar (below breadcrumb)
Horizontal row: `Back` | `Download` | `Annotate` | `Cite` | `Share`

### Left Pane — PDF Renderer (FR-I-02)
**Controls strip** (top of pane):
- `Pg 1 / 24` — current page / total pages
- `75%` — current zoom level
- `Zoom in / out` buttons (+ and − icons)
- `Find in doc` — opens inline search input

**Document render area** (white background, subtle drop shadow):
- Grey horizontal lines simulating text paragraphs
- One passage highlighted in **yellow `#FDE68A`**: label it `Highlighted passage (source cite)` with a dashed callout arrow pointing from the chat pane's source chip
- This highlight is the result of the user clicking a source chip in the right pane

**Text selection popup** (appears when user selects text — floating card near selection):
- Header: **"Selected text"** (small, bold)
- Action list:
  - `Summarize`
  - `Explain`
  - `Add annotation`
  - `Generate citation`
- Each action is clickable and sends the selected text to the chat pane or opens an annotation panel

### Right Pane — AI Chat Interface (FR-I-03)
**Context selector** (top of pane):
- Dropdown: `Context: ResearchPaper.pdf ▼`
- Clicking opens options: single doc, entire collection, or workspace-wide context

**Chat conversation area:**
- User message (right-aligned, dark rounded bubble): `"What is RAG architecture?"`
- AI response (left-aligned, light grey bubble):
  - Text: `"RAG combines retrieval of relevant chunks with LLM generation to ground answers..."`
  - Below the bubble: **Source highlight chips** — small yellow rounded badges: `pg. 3` · `pg. 7` · `pg. 12`
  - Clicking a chip scrolls the left pane to that page and highlights the exact passage in yellow (FR-I-03.2)
- User follow-up (right bubble): `"How does it differ from fine-tuning?"`
- AI response pending (optional: show typing indicator — three animated dots)

**@ Agent mention** (FR-I-03.3):
- Show one example message in the conversation: user types `@search_web latest RAG papers 2025`
- AI responds acknowledging the web search agent

**Bottom input bar:**
- Text input: placeholder `"Ask a question..."`
- Response length toggle (small, left of Send): `Short` · **`Med`** (active, dark) · `Detailed`
- `Send` button (filled black, right)

---

## PAGE 5 — UPLOAD DOCUMENT

**Route**: Modal overlay (triggered from Dashboard or Library)
**Purpose**: File ingestion workflow supporting PDF/DOCX/TXT uploads and web URL saving. (FR-D-02.1, FR-D-02.4)

### Modal Card
- Centered on page, white background, `border-radius: 16px`, drop shadow
- Width: 460px
- `×` close button top-right corner
- Title: **"Upload to Paper Trail"** (centered, bold)

### Tab Toggle (below title):
**`File upload`** (active — black fill, white text) | **`Web URL`** (inactive — light grey)

#### File Upload Tab (default)
- Dashed-border drop zone (rounded rectangle):
  - Upload arrow icon ↑ (centered)
  - Label: `Drag and drop here`
  - Subtext: `PDF, DOCX, TXT supported` (grey, smaller)
  - `Browse files` button (outlined, centered below subtext)
- Below drop zone:
  - Row: `Add to collection:` label (left) + `Select or create...` dropdown (right)
  - Row: `Processing:` label (left) + progress bar at 80% (dark fill) + `80%` text (right)
- Footer:
  - `Cancel` button (outlined, left)
  - `Upload` button (filled black, right)

#### Web URL Tab
- Input field full-width: placeholder `Paste a URL (e.g. https://arxiv.org/abs/...)`
- `Fetch & Save` button (filled black, full-width below input)
- Below: same `Add to collection:` row
- Same `Cancel` / `Save` footer buttons

---

## PAGE 6 — SETTINGS

**Route**: `/settings`
**Purpose**: User preferences, profile, security, subscription, and data export. (FR-D-01, FR-P, FR-T)

### Layout
- Left: Sidebar (Settings active)
- Breadcrumb: `Dashboard > Settings`
- Main content: white card, full-width horizontal tab strip at top

### Tabs:
`Profile` | **`Preferences`** *(default active)* | `AI Model` | `Security` | `Subscription` | `Export Data`

---

### Tab: Profile
- **Display name** — text input, e.g. `Mustafa Dilawar`
- **Email address** — text input, e.g. `mustafa@example.com`
- **Profile photo** — avatar circle + `Upload photo` button
- `Save changes` button (filled black)

---

### Tab: Preferences *(default active tab)*
Each row: label on left, control on right. (FR-P-01.1 to FR-P-01.4)

| Setting | Control |
|---|---|
| **UI Theme** | Toggle switch · `Light` ◯◉ `Dark` |
| **Citation style** | Dropdown: `APA 7th edition ▼` (options: APA 7th, MLA 9th, Chicago 17th) |
| **AI model** | Dropdown: `GPT-4o ▼` + small `Pro only` pill badge |
| **Response length** | Segmented button: `Short` · **`Medium`** (active) · `Detailed` |

Footer:
- `Save preferences` (filled black)
- `Reset to defaults` (outlined)

---

### Tab: AI Model
**General section:**
- **Language** — dropdown: `English ▼`
- **Enable auto-rename** — toggle (ON): subtext `Web search for automatic file renaming`
- **Include notes in AI responses** — toggle (ON): subtext `Allow AI to read and cite your notes`
- **Theme** — dropdown: `System ▼`

**Chat section** (sub-heading):
- **AI model** — dropdown: `Auto ▼` + `Pro` badge pill
- **Response length** — dropdown: `250 words ▼` + `Pro` badge pill
- **Citation format** — dropdown: `Numbered ▼`

**Editor section** (sub-heading):
- **AI model** — dropdown: `Auto ▼` + `Pro` badge pill
- **Citation format** — dropdown: `APA (7th edition) ▼`
- **Spellcheck** — toggle (OFF)

---

### Tab: Security
**Details section:**
- **Display name** — editable text field
- **Email address** — editable text field (shows current email)

**Security section:**
- **2-step Verification** — toggle (OFF by default)
  - Subtext: `Enable an extra layer of security to your Paper Trail account`

**Support section:**
- **Clear cookies** — description: `Remove all locally stored data. You'll need to sign in again.` → `Clear cookies` button (outlined, right)
- **Log out of all devices** — description: `Revoke all active sessions on any device you're logged in to.` → `Log out all devices` button (outlined, right)

**Danger Zone section** (red-tinted background or red border card):
- **Delete account** — description: `Permanently delete your Paper Trail account and all associated data. This cannot be undone.` → `Delete account` button (red filled)

---

### Tab: Subscription
**Current plan** status banner:
- Shows: `You are on the Free plan` (or current plan name in a badge)
- Buttons: `Upgrade plan` (filled black) · `Manage billing` (outlined) · `Cancel plan` (outlined, grey)
- Link: `View billing history ↗`
- Link: `View all plans and features on the pricing page ↗`

---

#### Upgrade Plan Page (`/settings/subscription/upgrade`)
*Can also be reached from the Upgrade button in the sidebar.*

- Heading: **"Upgrade plan"** (centered, large)
- Billing toggle: `Monthly` · **`Yearly`** (Yearly active — shows `save 20%` green badge)
- Seat count: `— 1 +`

**Three plan cards** (side by side):

**Plus — $10 USD/mo/seat** (billed yearly)
- `Choose Plus` button (outlined)
- Everything in Free, plus:
  - 4,000 AI words/day
  - 10 uploads/day
  - Access to GPT 4.5 Mini and Gemini 1.3 Flash-Lite
  - 100MB or 600 pages/import
  - Zotero and Mendeley connectors
  - 5 collaborators per folder

**Pro — $20 USD/mo/seat** (Popular badge — highlighted card with darker border)
- `Choose Pro` button (filled black)
- Everything in Plus, plus:
  - Unlimited AI words
  - Unlimited imports
  - Access to GPT 5.5, Claude Sonnet 4.6, Gemini 3.1 Pro and Gemini 3 Flash
  - 300MB or 10,000 pages/import
  - Google Drive, Notion, OneDrive connectors
  - 50 collaborators per folder
  - Priority support

**Max — $167 USD/mo/seat**
- `Choose Max` button (outlined)
- Everything in Pro, plus:
  - Deep Search agent
  - Complete Form agent
  - Access to Claude Opus 4.7 (advanced model)
  - Early access to new features

**Enterprise** section below cards:
- Heading: `Enterprise` — Price: `Custom`
- Subtext: `For large teams with advanced needs`
- `Contact Sales` button (outlined)

---

### Tab: Export Data
- Description: `Export your documents, annotations, and chat histories.`
- **Format** (radio or segmented): `Markdown` · `DOCX` · `PDF`
- **Scope** (radio): `All documents` · `Selected collection`
- `Export now` button (filled black)
- Note: `Exported files will be emailed to your registered email address.`

---

## PAGE 7 — WORKSPACES

**Route**: `/workspaces`
**Purpose**: Create and manage collaborative research workspaces. (FR-D-03)

### Workspaces List Page
- Left: Sidebar (Workspaces active)
- Breadcrumb: `Dashboard > Workspaces`
- Header row: **"Your Workspaces"** (large heading) + `+ New Workspace` button (top-right, filled black)
- Grid of workspace cards (2–3 columns):
  - Workspace icon/logo (letter avatar or uploaded image)
  - Workspace name: e.g., `Thesis Research`, `HCI Lab`, `Clinical Studies`
  - Member count: e.g., `3 members`
  - Document count: e.g., `18 docs`
  - Last active: e.g., `Active 2h ago`
  - `Open` button (appears on hover)

### Workspace Detail Page (`/workspaces/[workspace-name]`)
- Sidebar shows the workspace name at the top (replaces "Paper Trail" wordmark while inside)
- Breadcrumb: `Workspaces > Thesis Research`
- Sub-tabs: **Files** | **Chats**

**Files tab** (default):
- Same table layout as Library, scoped to this workspace
- Collections visible as folder groups above the document list

**Chats tab**:
- List of conversation threads:
  - Thread title (e.g., `Analysis of RAG methods`)
  - Participants: avatar stack + count
  - Last message preview
  - Last active timestamp
- `+ New chat` button (top right)

### Workspace Settings (`/workspaces/[workspace-name]/settings`)
Accessible via gear icon in workspace detail header.

**Workspace settings section:**
- **Name** — text input (workspace/company name)
- **Workspace URL** — text input: `aid.com/[slug]`
- **Icon** — upload button for company logo

**Members section:**
- `Invite link to add members` banner: `Anyone with this link can join this workspace if it is a paid workspace.` + `Copy link` button
- Stats row: `Total seats: 1` · `Available seats: 0` · `Next billing event: N/A`
- `Add members` button (top right, above table)
- Members table columns: `User (name + email)` | `2-step verification` | `Role`
- Sample row: `Mustafa Dilawar / mustafa@example.com` | Disabled | `Owner ▼`
- Roles in workspace: `Owner` · `Editor` · `Viewer` (dropdown per member)

**Security section:**
- Text: `Security features are available under Enterprise plan`
- Button: `Contact Sales`

**Danger Zone:**
- `Delete workspace` — description: `Permanently delete this workspace and all associated data.` → `Delete` button (red filled)

**Billing section** (sub-tab):
- Current plan badge
- Buttons: `Upgrade` · `Cancel plan` · `Manage billing`

---

## PAGE 8 — LANDING PAGE

**Route**: `/` (root — the very first page a visitor sees)
**Purpose**: Convert visitors into signups. Communicate Paper Trail's value proposition clearly and compellingly. This is the most important page in the prototype — it must feel polished, confident, and trustworthy.

### Overall Structure (single long-scrolling page with fixed top navbar)

---

### Section 1 — Top Navigation Bar (fixed, full-width)

- Left: **"Paper Trail"** wordmark (bold black)
- Center: Nav links (horizontal):
  - `Features`
  - `Pricing`
  - `Use Cases`
  - `Help`
- Right: Two buttons:
  - `Sign in` (outlined/ghost button)
  - `Get started free` (filled black CTA button)
- Background: white with a very subtle bottom border `1px solid #E8E8E8`
- On scroll: navbar gets a slight drop shadow to indicate it's floating

---

### Section 2 — Hero Section

**Layout**: Centered, full-viewport-height section. Light grey `#F5F5F7` background with a very subtle radial gradient or grain texture for depth.

**Content (vertically centered):**

- Small badge/pill above headline (accent bordered pill):
  `✦ Verifiable AI Research — Now Available`

- **Main Headline** (large, 56–64px, bold):
  `Research with AI you can actually trust.`

- **Subheadline** (18–20px, grey `#555`):
  `Paper Trail lets you upload your documents, ask questions, and get AI answers — every response linked directly back to the exact source passage. No hallucinations. No guessing.`

- **CTA buttons** (horizontal, centered below subheadline):
  - `Get started free` (filled black, large, 48px height)
  - `See how it works →` (ghost/text button with arrow)

- **Social proof line** below buttons (small grey text):
  `Trusted by 12,000+ researchers, PhD students, and analysts`
  — with 5 small avatar circles stacked + a star rating: `★★★★★ 4.9/5`

- **Hero product screenshot** (large, below CTA — 70% width, centered):
  - Show the Document Viewer page (two-pane layout) as a screenshot/mockup inside a browser frame (with browser chrome: url bar, window controls)
  - The screenshot shows a PDF on the left with a yellow highlighted passage and the AI chat on the right with source chips (`pg. 3`, `pg. 7`) visible
  - Browser frame has a subtle drop shadow and slight perspective tilt for depth (like a product mockup)
  - Caption below the screenshot in small grey: `Left: your document. Right: AI that cites its sources.`

---

### Section 3 — Social Proof / Logos Bar

**Layout**: Full-width, white background, centered.

- Label (small, grey, centered): `Used by researchers at`
- Row of 5–6 university/institution logo placeholders (grey, desaturated — since these are illustrative):
  - MIT · Stanford · Oxford · Harvard · NUS · ETH Zurich
  - (Use grey text wordmarks if logos aren't available — that's fine for prototype)

---

### Section 4 — Core Features (3-column grid)

**Layout**: White background section. Heading centered at top, then 3-column card grid.

- Section label (small, uppercase, grey): `WHAT AID DOES`
- **Section heading** (32–36px, bold, centered):
  `Everything your research workflow needs.`
- **Subtext** (grey, centered, max-width 560px):
  `From upload to insight — Paper Trail handles the heavy lifting so you can focus on thinking.`

**Feature cards** (3 per row, 2 rows = 6 total):

**Row 1:**

1. **Source-Verified Answers**
   - Icon: magnifying glass + document
   - Description: `Every AI response is backed by a clickable citation that jumps directly to the highlighted passage in your document. Trust, but verify — instantly.`
   - Tag: `Core Feature`

2. **Chat with Your Documents**
   - Icon: chat bubble + PDF
   - Description: `Ask questions in plain language across a single document or an entire collection. Paper Trail synthesizes answers from all your sources simultaneously.`
   - Tag: `AI-Powered`

3. **Smart Annotations**
   - Icon: pen + highlight
   - Description: `Select any text in your document to summarize it, explain it, add a personal note, or auto-generate a formatted citation — all in one click.`
   - Tag: `Workflow`

**Row 2:**

4. **Research Library**
   - Icon: bookshelf/grid
   - Description: `Upload PDFs, DOCX files, and web pages into one organized library. Create collections for each project, paper, or course.`
   - Tag: `Organization`

5. **Citation Management**
   - Icon: quote marks
   - Description: `Auto-generate citations in APA, MLA, or Chicago format from any highlighted passage. Paste directly into your paper.`
   - Tag: `Academic`

6. **Collaborative Workspaces**
   - Icon: people
   - Description: `Share your library with teammates. Work together on the same documents, conversations, and annotations in real time.`
   - Tag: `Teams`

---

### Section 5 — Feature Spotlight 1 (Source Highlighting)

**Layout**: Two-column, alternating (image left, text right). Light grey `#F5F5F7` background.

**Left side — Product UI mockup:**
- Show the Document Viewer's left pane: a PDF with a yellow highlighted passage (`#FDE68A`) clearly visible
- An arrow or dashed connector line leads from the yellow passage to the right...

**Right side — Text content:**
- Small badge: `Source Verification`
- **Heading** (28–32px, bold):
  `See exactly where every answer comes from.`
- **Body text:**
  `When Paper Trail answers your question, it doesn't just tell you — it shows you. Click any source chip in the chat and instantly jump to the highlighted passage in your document. Research you can verify in one click.`
- Bullet points (checkmarks, not dashes):
  - ✓ Every AI claim linked to a source passage
  - ✓ Highlights scroll and persist across sessions
  - ✓ Works across PDFs, DOCX, and saved web pages
- CTA link: `See it in action →`

---

### Section 6 — Feature Spotlight 2 (Multi-document Chat)

**Layout**: Two-column, reversed (text left, image right). White background.

**Left side — Text content:**
- Small badge: `AI Analysis`
- **Heading** (28–32px, bold):
  `Ask questions across your entire library.`
- **Body text:**
  `Don't limit your AI to a single file. Set the context to an entire collection and Paper Trail synthesizes insights across all your sources — comparing, contrasting, and identifying themes automatically.`
- Bullet points:
  - ✓ Single doc or multi-doc context
  - ✓ Use @ mentions to direct the AI (`@document1`, `@search_web`)
  - ✓ Conversation history saved per document and collection
- CTA link: `Try multi-doc chat →`

**Right side — Product UI mockup:**
- Show the AI chat pane with the context dropdown open, showing options: `ResearchPaper.pdf`, `LitReview.pdf`, `Entire Collection (4 docs)`
- Below it, a chat message with multiple source chips from different documents

---

### Section 7 — Feature Spotlight 3 (Upload & Organize)

**Layout**: Two-column (image left, text right). Light grey background.

**Left side — Product UI mockup:**
- Show the Upload modal (File upload tab) with a file being dragged in — dashed border glowing/highlighted, filename appearing in drop zone

**Right side — Text content:**
- Small badge: `Library Management`
- **Heading** (28–32px, bold):
  `Your research library, finally organized.`
- **Body text:**
  `Upload PDFs, DOCX files, and even paste web URLs to save any page as a document. Organize everything into collections by project, subject, or deadline.`
- Bullet points:
  - ✓ PDF, DOCX, TXT upload + web URL saving
  - ✓ OCR on scanned PDFs — make any image-based document searchable
  - ✓ Collections and workspaces for every project
- CTA link: `Upload your first document →`

---

### Section 8 — Pricing Section

**Layout**: Centered, white background. Anchor: `#pricing`

- Section label: `PRICING`
- **Heading** (32–36px, bold, centered):
  `Start free. Scale when you're ready.`
- **Subtext**: `No credit card required to get started.`

- Billing toggle: `Monthly` · **`Yearly`** (Yearly active, `save 20%` green badge)

**Three pricing cards** (same content as Subscription/Upgrade page — keep consistent):

**Free**
- Price: `$0` / forever
- CTA: `Get started free` (outlined button)
- Features:
  - 500 AI words/day
  - 3 uploads/day
  - Up to 100 pages per import
  - 1 collaborator per folder
  - Basic citation styles (APA, MLA)

**Pro — Popular** (highlighted card, dark border or black background)
- Price: `$20 USD/mo/seat` (billed yearly)
- CTA: `Start Pro free trial` (filled black or white button)
- Features:
  - Unlimited AI words
  - Unlimited uploads
  - Access to GPT 5.5, Claude Sonnet 4.6, Gemini 3.1 Pro
  - 300MB or 10,000 pages/import
  - Google Drive, Notion, OneDrive connectors
  - 50 collaborators per folder
  - Priority support

**Max**
- Price: `$167 USD/mo/seat` (billed yearly)
- CTA: `Choose Max` (outlined button)
- Features:
  - Everything in Pro, plus:
  - Deep Search agent
  - Complete Form agent
  - Claude Opus 4.7 (most powerful model)
  - Early access to new features

**Enterprise band** below cards:
- Left text: `Need a custom plan for your institution or organization?`
- Right: `Contact Sales →` button (outlined)

---

### Section 9 — Use Cases / Who It's For

**Layout**: Light grey background. Heading centered, then 2×2 or horizontal scrolling cards.

- Section label: `USE CASES`
- **Heading**: `Built for knowledge-intensive work.`

**4 Use Case cards** (2×2 grid):

1. **Academic Researchers & PhD Students**
   - Icon: graduation cap
   - Text: `Conduct literature reviews in hours, not weeks. Chat with 50 papers at once, auto-generate citations, and keep every claim traceable.`

2. **University Students**
   - Icon: pencil/book
   - Text: `Write better essays and dissertations. Upload your reading list and let Paper Trail help you find, understand, and cite the right passages.`

3. **Scientists & Physicians**
   - Icon: microscope/stethoscope
   - Text: `Review clinical literature and research papers with AI that never makes up references. Every answer is verifiable in the original source.`

4. **Financial Analysts & Consultants**
   - Icon: bar chart
   - Text: `Digest market reports, financial filings, and white papers. Ask specific questions and get direct answers backed by the exact page and paragraph.`

---

### Section 10 — Testimonials

**Layout**: White background, centered heading, 3 testimonial cards in a row.

- **Heading**: `Researchers love Paper Trail.`

**Testimonial Card 1:**
- Quote: `"I reviewed 40 papers for my lit review in one afternoon. Every AI answer linked directly to the passage — I never had to second-guess a claim."`
- Name: `Dr. Layla Hassan`
- Title: `Postdoctoral Researcher, Neuroscience`
- Avatar: placeholder circle

**Testimonial Card 2:**
- Quote: `"Paper Trail replaced my entire workflow — Zotero for organization, ChatGPT for questions, and manual ctrl+F to verify. Now it's all in one place, and I can actually trust the answers."`
- Name: `Marcus Chen`
- Title: `PhD Candidate, Computer Science`
- Avatar: placeholder circle

**Testimonial Card 3:**
- Quote: `"My team shares one workspace for our market research. Everyone can annotate, chat with the same documents, and export citations in the right format. Game changer."`
- Name: `Aisha Nkosi`
- Title: `Senior Analyst, McKinsey & Company`
- Avatar: placeholder circle

---

### Section 11 — Final CTA / Footer Banner

**Layout**: Full-width dark section (`#1A1A1A` background, white text). Bold, confident close.

- **Heading** (large, white, centered):
  `Start researching smarter today.`
- **Subtext** (grey, centered):
  `Free forever. No credit card required. Upload your first document in under a minute.`
- **CTA buttons** (centered):
  - `Get started free` (white filled button with black text — inverted)
  - `View pricing` (outlined white button)

---

### Section 12 — Footer

**Layout**: Dark background `#111111`, organized in 4 columns.

**Column 1 — Brand:**
- **Paper Trail** wordmark (white, bold)
- Tagline: `Verifiable AI Research`
- Social icons: Twitter/X · LinkedIn · GitHub

**Column 2 — Product:**
- Features
- Pricing
- Use Cases
- Changelog
- Roadmap

**Column 3 — Resources:**
- Help Center
- Documentation
- API (coming soon)
- Privacy Policy
- Terms of Service

**Column 4 — Company:**
- About
- Blog
- Careers
- Contact
- Status Page

**Bottom bar** (below the 4 columns, thin separator line above):
- Left: `© 2026 Paper Trail. All rights reserved.`
- Right: `Privacy · Terms · Cookies`

---

## PAGE 9 — AUTH PAGES

### Register Page (`/register`)
- Centered card on `#F5F5F7` background
- **Paper Trail** wordmark at top (bold)
- Heading: **"Create your account"**
- Fields:
  - Full name (text input)
  - Email address (text input)
  - Password (with show/hide toggle eye icon)
  - Confirm password
- `Create account` button (filled black, full-width)
- Subtext: `By creating an account you agree to our Terms of Service and Privacy Policy`
- Divider: `or`
- `Continue with Google` button (outlined, Google icon)
- Footer link: `Already have an account?` → `Sign in`

### Login Page (`/login`)
- Centered card on same background
- **Paper Trail** wordmark at top
- Heading: **"Welcome back"**
- Fields: Email · Password (with show/hide toggle)
- `Sign in` button (filled black, full-width)
- Link: `Forgot your password?` (right-aligned, below password field)
- Divider: `or`
- `Continue with Google` button
- Footer link: `Don't have an account?` → `Sign up`

### Forgot Password Page (`/forgot-password`)
- Heading: **"Reset your password"**
- Subtext: `Enter your email and we'll send you a reset link.`
- Email input (full-width)
- `Send reset link` button (filled black, full-width)
- Link: `Back to sign in`

### Email Verification Page (`/verify-email`) — NEW (FR-T-01.1)
*(Detailed above in Page 2)*

---

## PAGE 10 — OWNER / SUPER ADMIN DASHBOARD

**Route**: `/admin`
**Access**: Exclusively for the **platform Owner** — the single person who created and runs the Paper Trail SaaS platform. This is NOT accessible to any regular user, workspace owner, or any other role. It is a completely separate section with its own login/auth guard.

**Key principle**: There is only ONE admin role — the Owner. No other admin tiers exist. The Owner has full, unrestricted control over every aspect of the platform.

### Admin Auth Guard
- Separate login page at `/admin/login`:
  - Shows **"Paper Trail Admin"** wordmark with a small shield/⚡ icon badge
  - Email + password fields
  - `Sign in as Owner` button (filled dark)
  - No registration option (Owner account is pre-seeded)

### Admin Layout
- **Left sidebar** — always dark theme (`#111111` background):
  - Top: **"Paper Trail Admin"** wordmark + `Owner` badge (small, accent color)
  - Navigation sections with icons:

  **Overview**
  - Dashboard

  **Platform Analytics**
  - Analytics

  **Users**
  - All Users
  - Flagged Accounts

  **AI Configuration**
  - Model Management
  - Usage Limits

  **Subscriptions & Billing**
  - Plans & Pricing
  - Active Subscriptions
  - Revenue Analytics

  **Platform Control**
  - API Keys
  - Feature Flags
  - Audit Logs
  - System Health

- Bottom of sidebar: Logged in as `owner@aid.com` + `Log out` link

---

### Admin Page A — Overview Dashboard

Main content (dark cards on `#1A1A1A` background):

#### Stats Row (4 stat cards, horizontally):
| Stat | Value | Trend |
|---|---|---|
| Total Users | `12,482` | ↑ 8.2% this week |
| Active Paid Subscriptions | `3,241` | ↑ 3.1% this week |
| Monthly Recurring Revenue | `$48,230` | ↑ 12% MoM |
| Documents Processed | `284,910` | ↑ 5.4% this week |

#### Chart: User Growth (line chart, last 30 days)
- X-axis: dates. Y-axis: user count
- Two lines: Total Users (white/light) / Paid Users (accent blue)

#### Chart: Revenue by Plan (bar chart)
- Bars per plan: Free (grey) / Plus (blue-light) / Pro (blue) / Max (dark blue) / Enterprise (white)

#### Recent Activity Feed (right column — live log):
- `New user registered: ahmed@example.com — 2 min ago`
- `Plan upgraded: user@domain.com → Pro — 5 min ago`
- `Model config changed: GPT-4o set as Pro default — 12 min ago`
- `Flagged account: suspicious upload volume — 1h ago`

---

### Admin Page B — All Users

**Purpose**: Owner views, searches, manages, suspends, or deletes any user on the platform.

**Search and filter bar:**
- Search input: `Search users by name, email, or ID...`
- Filters: Plan (All / Free / Plus / Pro / Max / Enterprise) · Status (All / Active / Suspended / Flagged) · Date joined
- `Export CSV` button (top right)

**Users Table:**
Columns: `User ID` | `Name` | `Email` | `Plan` | `Status` | `Joined` | `Docs` | `Actions`

Sample rows:
| ID | Name | Email | Plan | Status | Joined | Docs | Actions |
|---|---|---|---|---|---|---|---|
| #00124 | Ahmed Raza | ahmed@ex.com | Pro | ✅ Active | Jan 15, 2026 | 42 | View · Suspend · ··· |
| #00125 | Sara Khan | sara@ex.com | Free | ✅ Active | Feb 2, 2026 | 8 | View · Upgrade · ··· |
| #00126 | Bot Account | bot@spam.com | Free | 🚩 Flagged | Mar 1, 2026 | 203 | View · Ban · ··· |

`···` overflow dropdown per row: `View Profile · Edit Plan · Reset Password · Suspend Account · Delete Account`

**User Detail Panel** (slide-in drawer from right, or separate page):
- Avatar + name + email + user ID + join date + last active timestamp
- **Subscription section**: current plan badge, billing cycle, next renewal date, `Change Plan` button (opens plan picker dropdown)
- **Usage stats**: AI words used this month / documents uploaded / storage used (progress bars)
- **Action buttons** (Owner only — these are destructive, shown with confirmation dialogs):
  - `Reset Password` (sends reset email to user)
  - `Suspend Account` (user cannot log in; toggle to unsuspend)
  - `Delete Account` (permanent — red button, requires typing user email to confirm)
- **Recent activity log**: last 10 user actions with timestamps

---

### Admin Page C — Flagged Accounts

**Purpose**: Review accounts automatically or manually flagged for suspicious activity.

- Filter: All Flags · Unusual upload volume · Bot activity · Payment disputes · Manual flags
- Table: same columns as All Users, filtered to flagged only
- Each row has: `Review · Clear flag · Suspend · Ban`
- Clicking `Review` opens user detail with flag reason and evidence (e.g., upload count spike chart)

---

### Admin Page D — Model Management

**Purpose**: Owner controls which AI models are available, which plans can access them, and which is the default per plan. (FR-I-04.1, FR-P-01.2)

**Active Models Table:**
Columns: `Model Name` | `Provider` | `Available to Plans` | `Status` | `Default For` | `Actions`

| Model | Provider | Plans | Status | Default For | Actions |
|---|---|---|---|---|---|
| GPT-4.5 Mini | OpenAI | Free, Plus | 🟢 Active | Free | Edit · Disable |
| GPT-4o | OpenAI | Plus, Pro | 🟢 Active | Plus | Edit · Disable |
| GPT-5.5 | OpenAI | Pro, Max | 🟢 Active | — | Edit · Disable |
| Claude Sonnet 4.6 | Anthropic | Pro, Max | 🟢 Active | Pro | Edit · Disable |
| Claude Opus 4.7 | Anthropic | Max | 🟢 Active | Max | Edit · Disable |
| Gemini 3.1 Pro | Google | Pro, Max | 🟢 Active | — | Edit · Disable |
| Gemini 3 Flash | Google | Pro, Max | 🟢 Active | — | Edit · Disable |
| Gemini 1.3 Flash-Lite | Google | Free, Plus | 🟢 Active | — | Edit · Disable |

**`+ Add New Model`** button → opens modal:
- Model name (text input)
- Provider (dropdown: OpenAI / Anthropic / Google / Other)
- API key / endpoint (masked input)
- Available to plans (multi-select checkboxes: Free / Plus / Pro / Max / Enterprise)
- Set as default for plan (optional dropdown)
- Status toggle: Active / Inactive
- `Save model` button

**Edit Model modal** (same fields, pre-filled + prominent Active/Inactive toggle at top)

---

### Admin Page E — Usage Limits

**Purpose**: Owner sets global caps on AI usage per plan tier to control costs.

Table of limits per plan:

| Limit | Free | Plus | Pro | Max | Enterprise |
|---|---|---|---|---|---|
| AI words/day | 500 | 4,000 | Unlimited | Unlimited | Custom |
| Uploads/day | 3 | 10 | Unlimited | Unlimited | Custom |
| Max file size (MB) | 10 | 100 | 300 | 500 | Custom |
| Max pages/import | 100 | 600 | 10,000 | Unlimited | Custom |
| Storage (GB) | 1 | 5 | 20 | 100 | Custom |
| Collaborators/folder | 1 | 5 | 50 | 100 | Custom |

Each cell is editable inline (click to edit → shows number input + save/cancel).
`Save all limits` button (filled, bottom right).

---

### Admin Page F — Plans & Pricing

**Purpose**: Owner edits subscription plan names, prices, features, and which models are included. (FR-T-01.3)

**Plan cards** (one card per plan: Free / Plus / Pro / Max / Enterprise):

Each card shows:
- Plan name (editable text)
- Monthly price (editable: `$ [input] USD/mo/seat`)
- Yearly price (editable: `$ [input] USD/mo/seat billed yearly`)
- Feature toggles/inputs (checkboxes and number inputs):
  - AI words per day *(number input)*
  - Uploads per day *(number input)*
  - Available AI models *(multi-select from Model Management list)*
  - Connectors: Zotero ☐ · Mendeley ☐ · Google Drive ☐ · Notion ☐ · OneDrive ☐
  - Max collaborators per folder *(number input)*
  - Priority support *(toggle)*
  - Deep Search agent *(toggle)*
  - Complete Form agent *(toggle)*
  - Early access to new features *(toggle)*
- `Save changes` button per card

`Preview public pricing page` button — opens the user-facing upgrade page in a preview frame.

---

### Admin Page G — Active Subscriptions

**Purpose**: Owner sees all currently paying subscribers with their plan, billing status, and renewal dates.

**Summary stats row:**
- Total paying users: `3,241`
- MRR: `$48,230`
- Churned this month: `42`
- New this month: `180`

**Subscriptions Table:**
Columns: `User` | `Plan` | `Seats` | `Billing Cycle` | `Next Renewal` | `Status` | `Actions`

Sample rows:
- Ahmed Raza | Pro | 1 seat | Yearly | Jun 1, 2026 | ✅ Active | View · Change Plan · Cancel
- Sara Khan | Plus | 3 seats | Monthly | May 15, 2026 | ✅ Active | View · Change Plan · Cancel
- Corp Account | Enterprise | 50 seats | Yearly | Jan 1, 2027 | ✅ Active | View · Manage

---

### Admin Page H — Revenue Analytics

**Purpose**: Owner tracks platform revenue over time.

- Date range selector (last 7d / 30d / 90d / 12mo / All time)
- Key metrics cards:
  - MRR: `$48,230` (↑ 12%)
  - ARR: `$578,760`
  - Average Revenue Per User: `$14.87`
  - Churn rate: `1.3%`
- Charts:
  - MRR over time (line chart)
  - Revenue breakdown by plan (stacked area chart)
  - New vs churned subscribers (bar chart)

---

### Admin Page I — API Keys

**Purpose**: Owner manages API keys for third-party LLM providers and other integrations. (FR-I-04.1, FR-I-04.2)

Table:
| Service | Key (masked) | Status | Last Used | Actions |
|---|---|---|---|---|
| OpenAI | `sk-...ab3f` | 🟢 Active | 2 min ago | Rotate · Revoke |
| Anthropic | `sk-ant-...7c2a` | 🟢 Active | 5 min ago | Rotate · Revoke |
| Google AI | `AIza...d8f1` | 🟢 Active | 1h ago | Rotate · Revoke |
| Stripe | `sk_live_...4e9c` | 🟢 Active | 3h ago | Rotate · Revoke |
| Zotero API | `xyz...123` | 🟡 Inactive | 2d ago | Activate · Rotate |

`+ Add API key` button → modal with: Service name, Key input (masked), `Save` button.

---

### Admin Page J — Feature Flags

**Purpose**: Owner enables or disables platform features globally or per plan tier without code deployment.

Table:
| Feature Flag | Description | Status | Enabled For |
|---|---|---|---|
| `source_highlighting` | Clickable source highlights in chat | 🟢 ON | All plans |
| `web_url_import` | Save web pages as documents | 🟢 ON | Plus, Pro, Max |
| `agent_mentions` | @ agent commands in chat | 🟡 Beta | Pro, Max |
| `export_data` | Data export (Markdown/DOCX/PDF) | 🟢 ON | All plans |
| `ocr_processing` | OCR for scanned PDFs | 🟢 ON | All plans |
| `zotero_connector` | Zotero import integration | 🟢 ON | Plus and above |
| `mendeley_connector` | Mendeley import integration | 🟢 ON | Plus and above |
| `google_drive_connector` | Google Drive import | 🟢 ON | Pro and above |
| `deep_search_agent` | Deep Search AI agent | 🔴 OFF | Max only |
| `complete_form_agent` | Complete Form AI agent | 🔴 OFF | Max only |
| `two_factor_auth` | 2FA option in Security settings | 🟢 ON | All plans |

Each row: toggle switch (ON/OFF) + plan scope multi-select dropdown + `Edit` button.

---

### Admin Page K — Audit Logs

**Purpose**: Owner reviews a full, tamper-proof log of all significant actions on the platform.

- Date range filter (from/to date pickers)
- Action type filter (dropdown): All / User login / Plan changed / Model changed / User suspended / User deleted / Flag raised / Feature flag toggled / API key rotated / Pricing changed
- Actor filter (search: owner email or user email)
- `Export logs (CSV)` button

**Logs Table:**
Columns: `Timestamp` | `Actor` | `Action` | `Target` | `IP Address` | `Details`

Sample rows:
- `2026-05-01 09:22` | owner@aid.com | Plan changed | ahmed@ex.com | 192.168.1.1 | Free → Pro
- `2026-05-01 10:05` | owner@aid.com | Model disabled | GPT-3.5-turbo | 192.168.1.1 | Deprecated model removed
- `2026-05-01 11:30` | system | Flag raised | bot@spam.com | 45.33.32.156 | Upload volume anomaly
- `2026-05-01 14:00` | owner@aid.com | Feature flag toggled | deep_search_agent | 192.168.1.1 | OFF → ON (Max only)
- `2026-05-01 15:10` | owner@aid.com | API key rotated | OpenAI | 192.168.1.1 | Routine rotation

---

### Admin Page L — System Health

**Purpose**: Owner monitors live status of all platform services.

**Service status grid** (card per service):
- API Server: 🟢 Operational
- Database (PostgreSQL): 🟢 Operational
- OpenAI Integration: 🟢 Operational
- Anthropic Integration: 🟡 Degraded — `Latency elevated (avg 4.2s)`
- Google AI Integration: 🟢 Operational
- Payment Gateway (Stripe): 🟢 Operational
- File Storage: 🟢 Operational
- OCR Service: 🟢 Operational
- Email Service: 🟢 Operational

**Live metrics section:**
- API response time chart (line graph, last 24h, ms on Y-axis)
- Error rate chart (bar chart — spikes shown in red)
- Active sessions: `1,284 users online now`
- Document processing queue: `12 pending · 0 failed`

**Maintenance mode toggle** (bottom of page):
- `Enable maintenance mode` — when ON, shows a maintenance banner to all users and blocks new logins

---

## INTERACTION STATES TO SHOW

For each major interactive element, show at minimum one alternate state as a separate frame:

1. **Landing page — hero**: Default state with product screenshot visible in browser mockup
2. **Landing page — pricing section**: Yearly billing toggle active, savings badges visible
3. **Landing page — navbar on scroll**: Drop shadow appears behind fixed navbar
4. **Upload modal — processing state**: Progress bar at 80%, file name shown in drop zone, Upload button active
5. **Upload modal — Web URL tab**: URL input filled with a URL, Fetch button highlighted
6. **Document viewer — text selection**: Floating popup visible with Summarize/Explain/Add annotation/Generate citation options
7. **Document viewer — source highlight active**: Yellow passage highlighted in left pane, matching chip highlighted in right chat pane
8. **Chat pane — @ agent**: User message shows `@search_web` mention, AI response acknowledges agent
9. **Settings > Preferences — dark mode ON**: Full interface rendered in dark theme
10. **Subscription upgrade page — yearly billing**: Yearly toggle active, 20% savings badges visible on cards
11. **Library — command palette open**: Search overlay visible with results
12. **Email verification page**: Full screen shown post-registration
13. **Admin — User detail drawer open**: Slide-in panel showing user profile, usage stats, and action buttons
14. **Admin — Add model modal open**: Form visible with all fields
15. **Admin — System health degraded**: One service card showing 🟡 with elevated latency warning

---

## NAVIGATION FLOW SUMMARY

```
/ (Landing page)
    ├── /login  ──────────────────────────────────────┐
    └── /register  →  /verify-email  →  /dashboard   │
                                            │         │
                ┌───────────────────────────┼─────────┘
                │                           │                           │
           /library                   /workspaces                 /settings
                │                           │                           │
      [command palette]           /workspaces/[name]           ├── Profile
                │                    ├── Files tab              ├── Preferences
      /library/[col]/[doc]           ├── Chats tab              ├── AI Model
          ├── PDF viewer             └── /settings              ├── Security
          │     └── [text selection popup]   ├── Members        ├── Subscription
          └── AI chat pane                   ├── Billing           └── /upgrade
                ├── source highlight chips   └── General        └── Export Data
                └── @ agent mentions

/admin/login  →  /admin
                    ├── Overview Dashboard
                    ├── All Users  →  User Detail Drawer
                    ├── Flagged Accounts
                    ├── Model Management
                    ├── Usage Limits
                    ├── Plans & Pricing
                    ├── Active Subscriptions
                    ├── Revenue Analytics
                    ├── API Keys
                    ├── Feature Flags
                    ├── Audit Logs
                    └── System Health
```

---

## IMPORTANT NOTES FOR STITCH

1. **Landing page is the entry point** — the flow starts at `/` (Landing), not at Login. The navbar on the landing page has Sign in and Get started free buttons that lead to `/login` and `/register` respectively.
2. **Landing page hero product screenshot** must show the actual Document Viewer layout (two-pane) inside a browser frame mockup — this is the most important visual on the page.
3. **Pricing on landing page must match** the Subscription/Upgrade page exactly — same plan names, same prices, same feature lists. Keep them consistent.
4. **The landing page navbar** is different from the app sidebar — it's a horizontal top navbar, not a left sidebar. The left sidebar only appears after login inside the app.
5. **Help link in sidebar is required** (FR-I-01.2) — must be present in the nav as a fifth item below Settings.
6. **Email verification screen is required** (FR-T-01.1) — this is a distinct page shown after registration, not just a toast notification.
7. **Recent Collections section on Dashboard is required** (FR-I-01.1) — both documents AND collections must be visible.
8. **Source highlight chips** in chat (`pg. 3`, `pg. 7`) must be small **yellow rounded badges**, not plain text links.
9. **The Admin panel is the Owner's exclusive domain** — no other user type can access `/admin`. It has its own separate login and its own dark-themed sidebar. Never show an admin link in the regular user navigation.
10. **Only ONE admin role exists** — the Owner. There are no other admin tiers. The owner controls everything: users, models, plans, flags, keys, and health.
11. **Workspace member roles** (Owner / Editor / Viewer) are workspace-level only — they define what a collaborator can do inside a shared workspace, not platform-level access.
12. **Dark mode toggle** must actually change the interface — show at least Dashboard and Document Viewer in dark mode as alternate frames.
13. **Upgrade button** in user sidebar always present, always links to `/settings/subscription/upgrade`.
14. **All modals** must have a visible `×` close button in the top-right corner.
15. **Breadcrumbs** must appear on all nested pages and each segment must look clickable (underline or color change).
16. **Responsive**: Design for desktop (1280px+) as primary. Tablet (768px+) as secondary.
17. **Do NOT use** the requirement IDs (FR-I-01.1, etc.) as visible text in any user-facing UI — they are SRS references only.
18. The `@ agent mentions` feature (FR-I-03.3) should be shown as a visible example in the chat pane — type `@search_web` and show how it looks in the input and in the response.

---

*This prompt is based on the Paper Trail SRS document (v1, Feb 2026) and presentation wireframes for UWE Assignment 2 (CLO-2), Web Engineering, BSE 6B. All plan pricing, model names, and connector details are illustrative and match the wireframe screenshots provided.*

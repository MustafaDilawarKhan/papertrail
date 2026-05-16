# Paper Trail — CRUD Test Cases

> **Priority key**: P1 = blocker, P2 = important, P3 = nice-to-have. **Type**: Functional (F), UI (U), Negative (N).

---

## A. Authentication (User)

### TC-AUTH-01 — Register new account (Create)
- **Priority/Type:** P1 / F
- **Preconditions:** App reachable, no account with the test email exists.
- **Steps:**
  1. Open `/register`.
  2. Fill name = "Test User", email = "test@example.com", password = "TestPass#2026".
  3. Click **Create Account**.
  4. Open the email mailbox → copy the 6-digit verification code.
  5. Enter the code on `/verify` → click **Verify**.
- **Expected:** Account row exists in `users` table (`email_verified = true`); user is redirected to `/dashboard`.

### TC-AUTH-02 — Register with duplicate email (Negative)
- **Priority/Type:** P1 / N
- **Steps:** Submit the registration form with an already-registered email.
- **Expected:** Inline error "An account with this email already exists." No row is created.

### TC-AUTH-03 — Login + view profile (Read)
- **Priority/Type:** P1 / F
- **Steps:** Submit valid credentials on `/login` → wait for redirect → open profile dropdown.
- **Expected:** JWT is stored; profile dropdown shows the correct user name and email.

### TC-AUTH-04 — Login with wrong password (Negative)
- **Priority/Type:** P1 / N
- **Expected:** Inline error "Invalid email or password." Form retains the email value.

---

## B. Workspace CRUD

### TC-WS-01 — Create workspace
- **Priority/Type:** P1 / F
- **Steps:** Dashboard → "Workspaces" → **+ New Workspace** → fill name = "Selenium QA" → submit.
- **Expected:** Card appears in the workspaces grid; row exists in `workspaces` with `owner_id = currentUser`.

### TC-WS-02 — View workspace detail
- **Priority/Type:** P1 / F
- **Steps:** Click the newly created workspace card.
- **Expected:** Detail page shows the workspace name, member list (owner only), and an empty documents list.

### TC-WS-03 — Rename workspace
- **Priority/Type:** P2 / F
- **Steps:** Workspace detail → Settings → change name → save.
- **Expected:** Toast "Workspace updated"; new name reflected in the breadcrumb and grid.

### TC-WS-04 — Delete workspace
- **Priority/Type:** P1 / F
- **Steps:** Workspace detail → Settings → **Delete Workspace** → confirm in modal.
- **Expected:** User is redirected to `/workspaces`; the card no longer appears; row soft/hard-deleted from `workspaces`.

### TC-WS-05 — Non-owner cannot delete (Authorization)
- **Priority/Type:** P1 / N
- **Steps:** Sign in as a viewer; navigate to a workspace they do not own; try to delete.
- **Expected:** Delete button is not visible; direct DELETE request returns 403.

---

## C. Collection CRUD

### TC-COL-01 — Create collection
- **Steps:** Library → Collections sidebar → **+ New Collection** → name = "Surveys" → submit.
- **Expected:** Collection appears in the tree; documents can now be dragged into it.

### TC-COL-02 — Read collection (filter library)
- **Steps:** Click "Surveys" in the tree.
- **Expected:** Library list filters to documents whose `collection_id` matches; URL updates with the collection id.

### TC-COL-03 — Rename collection
- **Steps:** Right-click "Surveys" → Rename → change to "Surveys-2024" → press Enter.
- **Expected:** Tree label updates; child documents stay attached.

### TC-COL-04 — Delete collection
- **Steps:** Right-click → Delete → confirm.
- **Expected:** Tree removes the entry; child documents fall back to "All Documents" (`collection_id = null`).

---

## D. Document CRUD

### TC-DOC-01 — Upload a PDF (Create)
- **Priority/Type:** P1 / F
- **Steps:** Library → **Upload** → drop `sample.pdf` (1–2 MB) → confirm.
- **Expected:** Upload progress bar reaches 100% → modal closes → new tab opens in the doc viewer → row exists in `documents` with `processing_status = 'ready'`.

### TC-DOC-02 — Open document (Read)
- **Priority/Type:** P1 / F
- **Steps:** Library → click the document name.
- **Expected:** Viewer renders the iframe; AI chat panel is visible on the right; tab appears in the tab bar.

### TC-DOC-03 — Rename + move document (Update)
- **Priority/Type:** P2 / F
- **Steps:** Right-click row → Rename → change file name → press Enter. Then drag the row onto "Surveys" collection.
- **Expected:** Name updates in the list; `collection_id` is now the surveys collection.

### TC-DOC-04 — Delete document
- **Priority/Type:** P1 / F
- **Steps:** Right-click row → Delete → confirm.
- **Expected:** Row disappears; storage object is removed; `documents` row is gone; closing the doc viewer tab also occurs.

### TC-DOC-05 — Upload unsupported file type (Negative)
- **Priority/Type:** P2 / N
- **Steps:** Try to upload `image.png`.
- **Expected:** Modal shows "Only PDF, DOCX, and TXT files are supported." No row is created.

### TC-DOC-06 — Upload over size limit (Negative)
- **Priority/Type:** P2 / N
- **Steps:** Upload a 100 MB file on a free plan (limit 25 MB).
- **Expected:** Inline error "File too large for your plan."

---

## E. Citation CRUD

### TC-CIT-01 — Generate a citation
- **Steps:** Open a document → Cite menu → choose "APA" → click **Generate**.
- **Expected:** Toast "Citation copied"; row exists in `citations` with `style = 'APA'`.

### TC-CIT-02 — List citations for a document
- **Steps:** Same document → Cite menu → "My citations".
- **Expected:** Drawer shows the APA citation created above.

### TC-CIT-04 — Delete a citation
- **Steps:** Citations drawer → trash icon → confirm.
- **Expected:** Citation row disappears.

---

## F. Annotation CRUD

### TC-ANN-01 — Highlight text in a PDF
- **Steps:** Document viewer → select a text range → click the yellow highlight button.
- **Expected:** Highlight persists on reload; row exists in `annotations`.

### TC-ANN-02 — List annotations
- **Steps:** Document viewer → "Annotations" tab in right rail.
- **Expected:** List shows the highlighted text and its page number.

### TC-ANN-03 — Edit annotation note
- **Steps:** Click the annotation → add a note "Important methodology" → save.
- **Expected:** Note field updates; reload still shows the note.

### TC-ANN-04 — Delete annotation
- **Steps:** Annotation overflow menu → Delete.
- **Expected:** Highlight removed from the PDF; row deleted.

---

## G. Chat Session CRUD

### TC-CHAT-01 — Send first message
- **Steps:** Document viewer → AI chat → type "Summarise this paper" → press Send.
- **Expected:** Spinner appears → assistant message renders with at least one source card → row exists in `chat_messages` (role = 'assistant') + `source_highlights`.

### TC-CHAT-02 — Reopen and read prior session
- **Steps:** Refresh the page.
- **Expected:** Prior messages render in order; source cards still clickable.

### TC-CHAT-04 — Delete session
- **Steps:** Session menu → Delete chat → confirm.
- **Expected:** Chat history clears; row removed from `chat_sessions` (cascade deletes `chat_messages`).

---

## H. Responsive Design

| ID | Viewport (px) | Expected behaviour |
|---|---|---|
| TC-RWD-01 | 1920 × 1080 | Full layout: sidebar + doc pane + AI chat all visible. |
| TC-RWD-02 | 1440 × 900 | Same as 1920 but slightly narrower chat pane. |
| TC-RWD-03 | 1024 × 768 | AI chat collapses to a slide-over drawer; sidebar narrows. |
| TC-RWD-04 | 768 × 1024 (tablet) | Sidebar collapses to icon-only; chat is a bottom sheet. |
| TC-RWD-05 | 360 × 800 (mobile) | Sidebar is a hamburger drawer; tabs scroll horizontally; chat is full-screen. |

---

## I. End-to-end CRUD smoke (single Selenium test)

**TC-E2E-01 — Full document lifecycle**

1. Register + verify a fresh user.
2. Create a workspace "QA".
3. Create a collection "Smoke" inside "QA".
4. Upload `sample.pdf` into the collection.
5. Open the document → ask the AI "What is this paper about?".
6. Highlight a sentence + add a note.
7. Generate an APA citation.
8. Rename the document.
9. Delete the document.
10. Delete the workspace.
11. Sign out.

**Expected:** Every step succeeds with no UI error; after teardown, the user has zero docs / zero workspaces.

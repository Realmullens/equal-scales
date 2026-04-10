# Equal Scales Live Build Loop

> This is the living execution heartbeat for autonomous or semi-autonomous Equal Scales development. Every Codex or Claude Code run must read this file at the start and update it before ending.

## How to use this file

If you are an agent:
1. Read `AGENTS.md`
2. Read `docs/README.md`
3. Read the canonical vision / roadmap / architecture docs listed there
4. Read this file fully
5. Execute only the current bounded task or the next explicitly authorized task
6. Update this file before ending your run

If you do not update this file, the loop is broken.

---

## Current program status

- Program: Equal Scales
- Product mode: matter-centered legal workspace
- Execution mode: spec-driven agentic development loop
- Primary long-run mode:
  - Claude Code = primary planning and implementation agent across consecutive bounded slices
  - Codex = active required review agent after each meaningful implementation part/checkpoint
- Human escalation target: Bailey
- Last updated: 2026-04-09

---

## Canonical governing docs

Read these before major work:
- `docs/vision/equal-scales-master-product-vision.md`
- `docs/roadmap/equal-scales-product-roadmap.md`
- `docs/architecture/equal-scales-domain-model.md`
- `docs/architecture/equal-scales-information-architecture.md`
- `docs/plans/2026-04-08-equal-scales-mempalace-architecture.md`
- `docs/plans/2026-04-08-equal-scales-template-first-implementation-spec.md`
- `docs/plans/2026-04-09-equal-scales-permissive-document-stack-implementation-guide.md`
- `docs/plans/2026-04-09-equal-scales-document-stack-phase-1-2-execution-plan.md`
- `docs/ops/equal-scales-outcome-tests.md`
- `docs/ops/equal-scales-agent-runbook-codex.md`
- `docs/ops/equal-scales-agent-runbook-claude-code.md`
- `docs/ops/equal-scales-milestones.md`

---

## Current phase focus

### Strategic phase
- Phase 1–2 bridge: template-first legal workspace foundations plus document workspace foundation planning

### Current build focus
- Milestone 0 is now operationalized
- next move is to begin Milestone 1 with one bounded legal workspace foundation slice

### Architecture note: Finder-first file strategy (2026-04-09)
Equal Scales uses native OS Finder (macOS) as the primary file exploration surface.
The app provides context-aware "Open in Finder" actions for vault root, client folder, matter folder, drafts, and source-documents.
There is no in-app file browser as the primary browsing experience.
The custom file browser code has been de-emphasized — old rendering functions exist as stubs but the panel HTML has been removed.
IPC handlers: `open-in-finder` (reveals file), `open-folder-in-finder` (opens folder). Both accept relative or absolute paths and enforce vault-root containment with separator-aware checks.

### What should happen next
The next implementation loop should execute Milestone 1 Slice 01 using the task package in `docs/ops/equal-scales-m1-slice-01-client-matter-foundation.md`.

---

## Current objective

Create a durable execution system that lets Codex and Claude Code advance Equal Scales with minimal repeated human prompting.

This means the repo must contain:
- a living loop file
- outcome tests
- Codex runbook
- Claude Code runbook
- milestone tracker
- updated read order and doc index

---

## Active task queue

Use these statuses only:
- `pending`
- `in_progress`
- `blocked`
- `done`

### LOOP-001 — Create live build loop document
- Status: done
- Owner: Hermes
- Acceptance:
  - file exists
  - explains how each run starts and ends
  - points to canonical docs

### LOOP-002 — Create outcome tests document
- Status: done
- Owner: Hermes
- Acceptance:
  - file exists
  - major product workflows are written as concrete acceptance scenarios
  - scenarios are usable by both Codex and Claude Code

### LOOP-003 — Create Codex runbook
- Status: done
- Owner: Hermes
- Acceptance:
  - file exists
  - tells Codex how to execute bounded tasks, verify, and update docs

### LOOP-004 — Create Claude Code runbook
- Status: done
- Owner: Hermes
- Acceptance:
  - file exists
  - tells Claude Code how to plan, review, use plan mode, and own frontend work

### LOOP-005 — Create milestones tracker
- Status: done
- Owner: Hermes
- Acceptance:
  - file exists
  - milestone slices are listed in a progression consistent with the roadmap

### LOOP-006 — Update doc indexes
- Status: done
- Owner: Hermes
- Acceptance:
  - docs index includes ops docs
  - AGENTS doc includes the live loop entry points where appropriate

### LOOP-007 — Sync new ops docs to Google Docs
- Status: done
- Owner: Hermes
- Acceptance:
  - all new ops docs have Google Doc mirrors
  - docs index contains their links

---

## Operating rules for every future run

### Rule 1: One bounded slice at a time
Do not attempt giant unfocused missions.
Pick one small but meaningful slice.

### Rule 2: Restate acceptance criteria first
Before coding, rewrite the current task in terms of:
- files likely touched
- expected behavior
- tests to run
- non-goals

### Rule 3: Verify before updating status
Do not mark a task done without running the relevant checks.

### Rule 4: Require cross-agent review after each implementation part
After Claude Code completes an implementation-heavy part, Codex must perform a review pass before the work is considered complete.
After Codex completes an implementation-heavy part, Claude Code should perform a product/spec review when the slice is design-sensitive or architecture-sensitive.
Do not treat single-agent self-approval as enough for important slices.

### Rule 5: Update docs as part of the work
If architecture, sequencing, or operating rules change, update the relevant docs before ending.

### Rule 6: Escalate only real product decisions
Do not ask Bailey routine implementation questions that the docs already answer.
Escalate only for true ambiguity, design forks, or licensing concerns.

---

## Verification log

### 2026-04-09 (Milestone 3 Slice 02)
- **Slice:** Document Workspace Integration into Electron App
- **What was built:**
  - IPC handler `open-document-editor` opens documents in dedicated BrowserWindow loading the React workspace
  - Document creation modal (title input overlay, creates doc + opens editor)
  - Documents panel on home screen (lists matter-scoped documents with + button)
  - Documents load/refresh on workspace context changes (client/matter selection)
  - Preload bridges: `openDocumentEditor()`, `createDocument()`, `listDocuments()`, `getDocument()`
- **Files modified:** `main.js`, `preload.js`, `renderer/renderer.js`, `renderer/index.html`, `renderer/style.css`
- **API verification:** Document CRUD endpoints tested (create, save content, retrieve, list, validation)
- **All existing tests still pass** (348 total)

### 2026-04-09 (Milestone 3 Slice 01)
- **Slice:** Document Workspace Foundation (OUTCOME-C1, C2, C3)
- **Result:** ALL TESTS PASSED (27/27)
- **What was built:**
  - React + Vite build system added to the project
  - Tiptap/ProseMirror editor with StarterKit + Underline extensions
  - Document workspace React components (DocumentWorkspace, DocumentEditor)
  - Toolbar: bold, italic, underline, H1-H3, bullet/ordered list, blockquote
  - Auto-save after 2 seconds of inactivity
  - Documents table in SQLite schema (matter-scoped)
  - Document CRUD repository + REST routes
  - Preload bridge for document operations
- **What was verified:**
  - C1: Document workspace build output exists, documents table in schema
  - C2: Tiptap JSON state round-trips: headings, bold marks, bullet lists all preserved
  - C3: Save, update, reload — content fidelity verified, title/status updates work
  - Matter scoping: documents isolated per matter, FK constraint enforced
  - Document deletion works
- **Files added:** `vite.config.js`, `renderer/document/`, `server/storage/repositories/documents.js`, `server/routes/documents.js`, `server/tests/verify-document-foundation.js`
- **Files modified:** `package.json`, `server/storage/schema.sql`, `server/server.js`, `preload.js`
- **Build command:** `npm run build:document`
- **Verification:** `cd server && node tests/verify-document-foundation.js`
- **Cumulative:** M1 (167) + M2 (154) + M3-S01 (27) = 348 tests

### 2026-04-09 (Milestone 2 Slice 03)
- **Slice:** Chat-Driven Navigation (OUTCOME-F1, F2)
- **Result:** ALL TESTS PASSED (30/30)
- **What was built:**
  - Navigation search API: `GET /api/navigate/search?q=...` — fuzzy search across clients, matters, drafts
  - Results include entity type, IDs, names, and parent context (client name on matters, matter name on drafts)
  - Renderer-side navigation functions: `navigateToClient()`, `navigateToMatter()`, `navigateToDraft()`
  - Global `window.equalScalesNav` object exposed for future agent-driven navigation
  - Preload bridge: `searchWorkspace(query)`
- **What was verified:**
  - F1: Client search by name and partial match
  - F1: Matter search with client context included
  - F2: Draft search with client + matter context
  - Cross-entity search returns all matching types
  - Input validation (missing/empty query → 400)
- **Files added:** `server/routes/navigate.js`, `server/tests/verify-navigation-search.js`
- **Files modified:** `server/server.js`, `preload.js`, `renderer/renderer.js`
- **Verification:** `cd server && node tests/verify-navigation-search.js` (requires running server)
- **Cumulative:** M1 (167) + M2 (154) = 321 tests

### 2026-04-09 (Milestone 2 Slice 02)
- **Slice:** Drafting API Integration (full renderer flow simulation)
- **Result:** ALL TESTS PASSED (50/50)
- **What was verified:**
  - Full API call sequence matching renderer flow: create client → create matter → list templates → get template detail → generate prompt → save draft → list drafts → reopen draft → save revision
  - Version management via API (v1 → v2, both listed)
  - Input validation (400/404 for bad requests across all endpoints)
  - File browser API (root listing, DB files hidden)
  - Template origin preserved through save/reopen cycle
- **Files added:** `server/tests/verify-drafting-api-integration.js`
- **Requires:** server running on localhost:3001
- **Verification command:** `cd server && node tests/verify-drafting-api-integration.js`
- **Cumulative:** M1 (167) + M2-S01 (74) + M2-S02 (50) = 291 tests
- **M2 status:** Backend drafting loop fully verified. Renderer UX verified at API level. Agent-level integration (Claude SDK filling templates) requires manual testing with API credentials.

### 2026-04-09 (Milestone 2 Slice 01)
- **Slice:** End-to-End Template-First Drafting Loop Verification
- **Result:** ALL OUTCOME TESTS PASSED (74/74 tests)
- **What was verified:**
  - OUTCOME-B1: Template library browsable (5 templates, metadata complete, type filtering, body retrieval)
  - OUTCOME-B2: Draft prompt assembly (template + matter context + user instructions → complete prompt)
  - OUTCOME-B3: Draft uses scoped matter context (client profile, matter.md, facts.md — no unrelated data)
  - OUTCOME-B4: Save and reopen draft (file on disk, DB record, content matches, template origin preserved)
  - Draft versioning: v1/v2 coexist, versions sorted, old versions preserved
  - Cross-matter isolation: same title in different matters has independent version numbering
- **Files added:** `server/tests/verify-drafting-loop-e2e.js`
- **Verification command:** `cd server && node tests/verify-drafting-loop-e2e.js`
- **Cumulative verification:** M1 (167 tests) + M2-S01 (74 tests) = 241 tests

### 2026-04-09 (Milestone 1 Slice 03)
- **Slice:** Vault Filesystem Integrity Verification
- **Result:** ALL ACCEPTANCE CRITERIA PASSED (64/64 tests)
- **What was verified:**
  - Vault root structure (VAULT_ROOT, CLIENTS_DIR, TEMPLATES_DIR exist)
  - Client vault creation: directory + profile.md + notes.md + matters/ subdirectory
  - Starter file content contains client/matter names and expected structure
  - Idempotency: re-running vault creation does not overwrite custom edits
  - Matter vault creation: directory + matter.md + facts.md + tasks.md + drafts/ + source-documents/
  - Path helpers: clientDir, matterDir, matterDraftsDir, matterSourceDocsDir produce correct paths
  - Vault path safety: isInsideVault blocks traversal, prefix escapes, system paths
  - Template directory structure: all 5 categories exist with seeded templates
  - DB-stored paths match actual filesystem paths
- **Files added:** `server/tests/verify-vault-filesystem-integrity.js`
- **Verification command:** `cd server && node tests/verify-vault-filesystem-integrity.js`
- **Cumulative M1 verification:** 41 + 62 + 64 = 167 tests across 3 slices
- **Next:** Milestone 1 foundation is now fully verified. Ready to advance to Milestone 2 (template-first drafting MVP) or begin document workspace shell.

### 2026-04-09 (Milestone 1 Slice 02)
- **Slice:** Template, Draft, and Conversation Foundation Hardening
- **Result:** ALL ACCEPTANCE CRITERIA PASSED (62/62 tests)
- **What was verified:**
  - Templates: create, get by ID/slug, list, list by type, update metadata, slug uniqueness constraint
  - Drafts: create, get, list by client, list by matter, version scoping across matters, cross-client ownership blocked, nonexistent matter blocked, status update
  - Conversations: create, get, list scoped by client/matter, no cross-client leakage, unscoped conversations work, cross-client ownership blocked
  - Messages: create, retrieve in insertion order (rowid tiebreaker), metadata JSON, conversation-scoped (no leakage), FK constraint on nonexistent conversation
- **Files added:** `server/tests/verify-template-draft-conversation-foundation.js`
- **Verification command:** `cd server && node tests/verify-template-draft-conversation-foundation.js`
- **Next recommended slice:** Milestone 1 Slice 03 — Vault filesystem integrity verification (verify vault directory creation, starter markdown files, path safety, file existence after client/matter creation)

### 2026-04-09 (Milestone 1 Slice 01)
- **Slice:** Client and Matter Foundation Hardening
- **Result:** ALL ACCEPTANCE CRITERIA PASSED (41/41 tests + 6 API checks)
- **What was verified:**
  - AC1: Database init is safe and idempotent (tables, FK, WAL, re-init)
  - AC2: Client CRUD works (create, get by ID/slug, list, slug disambiguation, root_path update)
  - AC3: Matter CRUD works (create under client, get, list by client, no cross-client leakage, slug disambiguation, matter_path update)
  - AC4: Invalid input rejected (empty name → 400, missing clientId → 400, nonexistent client → 404, FK constraint on nonexistent client)
  - AC5: Repeatable verification script: `cd server && node tests/verify-client-matter-foundation.js`
- **Files added:** `server/tests/verify-client-matter-foundation.js`
- **Files unchanged:** All existing storage/route code passed without needing modifications — earlier Codex review fixes had already hardened slug disambiguation, cross-client ownership validation, and input validation
- **Next recommended slice:** Milestone 1 Slice 02 — Template and Draft Foundation Hardening (verify template sync, draft creation/versioning, cross-client ownership checks, add verification script)

### 2026-04-09 (Milestone 0)
- Created initial agentic development loop strategy doc
- Created this live build loop file
- Created the outcome tests file
- Created Codex and Claude Code runbooks
- Created the milestone tracker
- Updated `docs/README.md` and `AGENTS.md` to include the ops layer
- Mirrored the ops docs into Google Docs and recorded links in the docs index

---

## Blockers

None currently.

---

## Decisions made

- Equal Scales should use a spec-driven agentic loop, not a vague autonomous coding prompt
- Claude Code should generally act as planner/reviewer/frontend lead
- Codex should generally act as executor/backend lead
- every loop must update this file before ending

---

## Next automatic task

Milestone 2 complete (154 tests across 3 slices).
OUTCOME-B1 through B4 and F1/F2 verified at repository, API, and navigation levels.
Agent integration (Claude SDK filling templates) requires manual testing with API credentials.

Milestone 3 in progress. Slice 01 (data + build) and Slice 02 (app integration) done.
The document editor opens in a dedicated window from matter context.
Next: M3 Slice 03 — document API integration test + milestone completion verification.

Expected result of the next run:
- the existing local legal workspace storage layer is verified and hardened
- the live build loop is updated with results
- the next Milestone 1 slice is recommended

# Equal Scales Permissive-License Document Stack Implementation Guide

> For Hermes / coding agents: this document is the architecture and bootstrap guide for building the Equal Scales document viewer and editor with MIT-style or other permissive licenses only. Do not introduce copyleft, source-available, or commercial add-on dependencies into the core document stack unless Bailey explicitly approves them.

## 1. Purpose

This document explains how to implement the open-source document stack we discussed in a way that is practical, simple, and immediately usable inside the current Equal Scales application base.

It covers:
- which tools belong in the permissive-only stack
- which tools should be first-class in v1 versus postponed
- how to wire them into the current Electron + Express application
- what each tool is responsible for
- how data should flow between editor, collaboration, storage, jobs, and the agent
- what open-source example projects and docs already demonstrate these patterns

This is not trying to make Equal Scales a perfect Microsoft Word clone on day one.
This is trying to make Equal Scales feel trustworthy, fast, legal-workflow friendly, and architecturally correct from the start.

---

## 2. Hard Rules For This Stack

1. Core production dependencies must use permissive licenses.
2. Do not depend on Tiptap Pro or other commercial editor add-ons.
3. Do not depend on ONLYOFFICE/Collabora-style embedded office suites for the core editor.
4. The agent must edit through structured document commands, not by DOM automation.
5. The canonical live-edit format should be structured editor state, not DOCX.
6. DOCX and PDF are exchange/output formats, not the primary source of truth.

---

## 3. Recommended Stack, With Practical Decisions

## 3.1 Keep

- React
- Tiptap core
- ProseMirror
- Yjs
- Hocuspocus
- PostgreSQL
- BullMQ
- pdf.js
- Mammoth

## 3.2 Defer Or Treat As Optional

- Next.js: optional for a future browser-first deployment; not required for the current Electron-based app
- DOCX export perfection: defer until the structured editor is solid
- page-perfect Word fidelity: defer until comments, suggestions, numbering, and review flows are stable

## 3.3 Important simplification

Because Equal Scales is currently based on Open Claude Cowork, which is an Electron desktop shell with a Node/Express backend, the simplest path is:

- keep Electron as the app shell
- add a React-powered document workspace inside the renderer
- add a Hocuspocus collaboration server beside the existing Express server
- add PostgreSQL for durable server-backed metadata and history
- use BullMQ workers for import/export/indexing jobs

Do not force Next.js into v1 unless there is a separate web app requirement.

That keeps the implementation simpler and gets the document system working faster.

---

## 4. What We Learned From Existing Open-Source Patterns

The following references are especially useful because they show the exact architectural ideas we want:

### 4.1 Tiptap docs
Reference: https://tiptap.dev/docs/editor/getting-started/overview

What it shows:
- Tiptap is a headless editor framework, not a full office suite
- it wraps ProseMirror cleanly
- it expects the application to own UI, schema, commands, and behavior

Takeaway for Equal Scales:
- use Tiptap as the editor shell, not as the product architecture

### 4.2 ProseMirror guide
Reference: https://prosemirror.net/docs/guide/

What it shows:
- the document is a structured data model, not an HTML blob
- all edits should flow through transactions
- schema and plugins are the real foundation

Takeaway for Equal Scales:
- agent operations must be transactions against a controlled schema

### 4.3 Yjs docs
Reference: https://docs.yjs.dev/

What it shows:
- CRDT-based shared editing
- offline-friendly sync
- awareness/presence patterns
- building blocks for Google-Docs-style collaboration

Takeaway for Equal Scales:
- collaboration should be modeled as shared document state, not ad hoc API patching

### 4.4 Hocuspocus docs
Reference: https://tiptap.dev/docs/hocuspocus/getting-started/overview

What it shows:
- a practical WebSocket backend for Yjs
- persistence hooks
- auth hooks
- Redis-based scaling path

Takeaway for Equal Scales:
- use Hocuspocus as the collaboration transport/server layer instead of inventing our own sync protocol

### 4.5 Yjs demos repository
Reference: https://github.com/yjs/yjs-demos

What it shows:
- working Yjs demos for multiple editors and demo servers
- a pattern of keeping the shared document state separate from transport and UI
- proof that collaborative editing should be bootstrapped from small, composable pieces

Takeaway for Equal Scales:
- start with the smallest collaboration loop that works, then layer legal features on top

### 4.6 Outline rich-markdown-editor
Reference: https://github.com/outline/rich-markdown-editor

What it shows:
- a real React + ProseMirror editor organized as reusable components
- how editor UI, commands, and plugins can stay modular

Takeaway for Equal Scales:
- keep the document workspace modular: editor canvas, toolbars, sidebars, comments, and command handling should not be tangled together

---

## 5. High-Level Architecture

Equal Scales should implement the document system as six layers.

### Layer 1: Electron shell
Responsibilities:
- app window
- navigation
- chat-centered workspace shell
- document workspace mounting

### Layer 2: React document workspace
Responsibilities:
- document canvas
- toolbar
- right-side review panel
- left-side outline and document navigator
- AI command bar
- document metadata surface

### Layer 3: Tiptap + ProseMirror editing engine
Responsibilities:
- schema
- commands
- selections
- transactions
- node views
- decorations
- editor plugins

### Layer 4: Yjs + Hocuspocus collaboration layer
Responsibilities:
- shared state
- multiplayer edits
- presence/cursors
- offline-tolerant sync
- update broadcasting

### Layer 5: Application backend
Responsibilities:
- auth and permissions
- document metadata
- comments and review history
- versioning
- job orchestration
- agent command execution

### Layer 6: Background services
Responsibilities:
- DOCX import
- export jobs
- PDF derivative generation
- indexing
- snapshotting
- diff generation

---

## 6. Tool-By-Tool Implementation Guide

## 6.1 React

Role:
- React is the UI composition layer for the document workspace.
- It should own panes, sidebars, toolbars, dialogs, and command surfaces.
- It should not own document truth; the editor state belongs to ProseMirror/Yjs.

Why we need it:
- the current app shell is not enough for a rich editor workspace
- legal document UX needs multiple synchronized panels
- React is the cleanest way to manage these interfaces

How to implement it in Equal Scales:
- add a renderer-side React app mounted inside the existing Electron window
- keep chat as the primary shell, but let React own the document route/view
- structure React components by workspace responsibility, not by random UI pieces

Recommended component tree:
- DocumentWorkspace
  - DocumentHeader
  - DocumentToolbar
  - DocumentCanvas
  - OutlineSidebar
  - ReviewSidebar
  - AgentCommandBar
  - DocumentStatusBar

Initial files to create:
- `renderer/document/index.tsx`
- `renderer/document/DocumentWorkspace.tsx`
- `renderer/document/components/DocumentCanvas.tsx`
- `renderer/document/components/DocumentToolbar.tsx`
- `renderer/document/components/OutlineSidebar.tsx`
- `renderer/document/components/ReviewSidebar.tsx`
- `renderer/document/components/AgentCommandBar.tsx`

Right-off-the-bat milestone:
- render a document route in Electron
- mount an empty Tiptap editor inside `DocumentCanvas`
- render static left/right sidebars around it

---

## 6.2 Tiptap Core

Role:
- Tiptap is the developer-friendly shell over ProseMirror.
- It provides extension composition and ergonomic command wiring.

Why we need it:
- raw ProseMirror is powerful but slower to ship with
- Tiptap lets us build a custom legal editor without losing ProseMirror control

How to implement it:
- start with a minimal editor, not a kitchen sink
- use a small extension set first: paragraph, text, heading, bold, italic, underline, link, bullet list, ordered list, blockquote, code, hard break, table
- add legal-specific extensions only after the editor loop is stable

Equal Scales-specific rule:
- never treat Tiptap as the entire document system
- Tiptap is the editing framework, not comments, not versioning, not permissions, not review workflow

Initial files:
- `renderer/document/editor/createEditor.ts`
- `renderer/document/editor/extensions/baseExtensions.ts`
- `renderer/document/editor/extensions/legalParagraph.ts`
- `renderer/document/editor/extensions/definedTerm.ts`

Right-off-the-bat milestone:
- editor loads a stored document
- user can type, format, and save
- document content serializes to structured JSON

---

## 6.3 ProseMirror

Role:
- ProseMirror is the actual document engine.
- It provides schema, transactions, plugin hooks, selection logic, and transformation rules.

Why we need it:
- Word-grade behavior requires a real transaction model
- legal documents require constraints and structure
- the agent needs deterministic, reversible edits

How to implement it:
- define a strict Equal Scales schema early
- prefer legal-aware node types over generic HTML dumping
- introduce document metadata as editor state or attached document metadata, not loose ad hoc attributes everywhere

Minimum schema for v1:
- document
- paragraph
- heading
- ordered_list
- bullet_list
- list_item
- blockquote
- text
- table
- table_row
- table_cell
- horizontal_rule
- hard_break
- marks: bold, italic, underline, link

Legal-specific nodes/marks for v1.5:
- numbered_paragraph
- clause_block
- defined_term mark
- citation_anchor
- comment_anchor
- change_insertion mark
- change_deletion mark

Critical design rule:
Every meaningful edit should be representable as a ProseMirror transaction.
That includes agent actions.

Example agent command mapping:
- “rewrite selected paragraph” -> replace range transaction
- “insert clause” -> insert node transaction
- “apply numbering” -> custom transaction with numbering plugin recalculation
- “add comment” -> anchor metadata + review record creation

Initial files:
- `renderer/document/editor/schema/index.ts`
- `renderer/document/editor/plugins/numberingPlugin.ts`
- `renderer/document/editor/plugins/commentDecorations.ts`
- `renderer/document/editor/plugins/changeTracking.ts`
- `renderer/document/editor/commands/agentCommands.ts`

Right-off-the-bat milestone:
- define schema and base commands before building comments or AI editing

---

## 6.4 Yjs

Role:
- Yjs is the shared document state and CRDT engine.

Why we need it:
- multiple humans and the agent may touch a draft
- legal drafting needs robust sync, not naive last-write-wins APIs
- we want offline-friendly, resilient document state

How to implement it:
- one Y.Doc per Equal Scales document
- bind the ProseMirror/Tiptap editor to the shared Yjs doc
- separate awareness state from durable content state
- do not store comments only in awareness; comments belong in durable app storage plus anchored positions

Key design decision:
- content body is collaborative shared state
- review objects and metadata live in PostgreSQL, with anchors into the document

Why that split matters:
- Yjs is excellent for shared content state
- PostgreSQL is better for queryable metadata, permissions, review state, and audit logs

Initial files:
- `renderer/document/collab/createYDoc.ts`
- `renderer/document/collab/connectProvider.ts`
- `server/collab/documentRegistry.ts`

Right-off-the-bat milestone:
- two clients can open the same document and see edits appear in real time

---

## 6.5 Hocuspocus

Role:
- Hocuspocus is the WebSocket collaboration server for Yjs.

Why we need it:
- it gives us a practical, proven sync server
- it provides auth, hooks, persistence integration, and a scaling path
- it is much faster than inventing our own collaboration backend

How to implement it:
- run Hocuspocus beside the existing Express server in the backend process or as a sibling service
- authenticate connections with Equal Scales user/session tokens
- map each Hocuspocus document name to an Equal Scales `document_id`
- persist updates or snapshots through backend hooks

Recommended initial server behavior:
- onAuthenticate: validate user session and document access
- onLoadDocument: fetch latest durable state/snapshot for document
- onStoreDocument: persist Yjs update or periodic snapshot
- onConnect/onDisconnect: update presence telemetry

Initial files:
- `server/collab/hocuspocusServer.ts`
- `server/collab/authenticateCollabUser.ts`
- `server/collab/persistence.ts`

Right-off-the-bat milestone:
- WebSocket collaboration works for a single document room
- auth prevents cross-matter leakage

---

## 6.6 PostgreSQL

Role:
- PostgreSQL stores durable application data.

Why we need it:
- comments, versions, permissions, jobs, audit trails, and document metadata should not live only inside editor JSON
- legal applications need queryable history and controls

How to implement it:
- keep editor body and app metadata conceptually separate
- store document row metadata in PostgreSQL
- store periodic editor snapshots and update references in PostgreSQL
- store comments, suggestions, versions, and agent actions in relational tables

Minimum tables for v1:
- documents
- document_versions
- document_comments
- document_suggestions
- document_presence_sessions
- document_agent_actions
- document_exports

Suggested core columns:

`documents`
- id
- matter_id
- title
- status
- latest_snapshot_id
- created_at
- updated_at

`document_versions`
- id
- document_id
- version_number
- snapshot_json
- yjs_update_blob_reference
- created_by
- created_at
- reason

`document_comments`
- id
- document_id
- anchor_from
- anchor_to
- body
- status
- created_by
- resolved_by
- created_at
- resolved_at

`document_agent_actions`
- id
- document_id
- actor_type
- actor_id
- action_type
- payload_json
- transaction_summary
- created_at

Right-off-the-bat milestone:
- save documents, comments, versions, and agent actions reliably

---

## 6.7 BullMQ

Role:
- BullMQ handles background and retryable jobs.

Why we need it:
- DOCX import, export, PDF generation, indexing, and snapshot compaction should not block the live editing loop
- legal workflows need traceable job status

How to implement it:
- one queue namespace for document ingestion/export
- one queue namespace for indexing and background analysis
- one queue namespace for maintenance tasks like snapshot compaction

Recommended queues:
- `document-import`
- `document-export`
- `document-index`
- `document-maintenance`

Example jobs:
- import a DOCX via Mammoth
- build a PDF derivative from a saved snapshot
- compute a version diff
- re-index document chunks for retrieval

Initial files:
- `server/jobs/queues.ts`
- `server/jobs/workers/documentImportWorker.ts`
- `server/jobs/workers/documentExportWorker.ts`
- `server/jobs/workers/documentIndexWorker.ts`

Right-off-the-bat milestone:
- importing a DOCX becomes an async job with visible status in the UI

---

## 6.8 Mammoth

Role:
- Mammoth converts DOCX into semantic HTML.

Why we need it:
- lawyers will bring in DOCX files constantly
- we need a permissive-license way to bootstrap DOCX ingestion

Important limitation:
- Mammoth is useful for semantic import, not perfect Word round-tripping
- this is acceptable in v1 if we are honest about it

How to implement it:
1. upload DOCX
2. BullMQ import worker runs Mammoth
3. Mammoth converts DOCX to HTML
4. HTML is normalized into a constrained intermediate representation
5. intermediate representation is converted into ProseMirror/Tiptap JSON
6. imported document is saved as a new Equal Scales draft
7. user sees an import report listing anything that did not map cleanly

Do not:
- dump raw Mammoth HTML directly into the live editor without normalization
- pretend imported numbering/comments/styles will always be perfect

Initial files:
- `server/importers/docx/importDocxWithMammoth.ts`
- `server/importers/docx/htmlToProseMirror.ts`
- `server/importers/docx/importReport.ts`

Right-off-the-bat milestone:
- DOCX imports into an editable draft with headings, paragraphs, lists, links, and tables preserved when possible

---

## 6.9 pdf.js

Role:
- pdf.js is the in-app PDF viewer.

Why we need it:
- attorneys review final PDFs, court filings, exhibits, and source documents constantly
- the document workspace should support side-by-side draft + PDF review

How to implement it:
- use pdf.js for read/review surfaces, not for editing live text documents
- support document split view: editable draft on one side, source PDF on the other
- support anchored references from draft comments to PDF pages or quoted source spans later

Initial files:
- `renderer/document/pdf/PdfViewer.tsx`
- `renderer/document/pdf/usePdfDocument.ts`

Right-off-the-bat milestone:
- open a PDF in a side panel or split pane inside the same workspace

---

## 6.10 Next.js

Role:
- optional future web application shell

Why it is not required now:
- Equal Scales already has an Electron application base
- forcing Next.js into v1 increases complexity without helping the core document editor work faster

Recommendation:
- do not make Next.js part of the first implementation unless there is an explicit browser deployment requirement
- if later needed, reuse the React document workspace and backend APIs with a thin Next.js shell

Right-off-the-bat milestone:
- none; defer

---

## 7. The Agent Control Layer

This is the key Equal Scales differentiator.

The agent should not be allowed to "type into the editor" like a human test bot.
Instead, it should call structured document commands.

Required command families:
- selection commands
- insertion commands
- rewrite commands
- review commands
- comment commands
- formatting commands
- navigation commands

Example API contract:
- `insertClause(documentId, clauseId, position)`
- `rewriteRange(documentId, from, to, instructions)`
- `addComment(documentId, from, to, body)`
- `suggestEdit(documentId, from, to, replacement, rationale)`
- `acceptSuggestion(documentId, suggestionId)`
- `rejectSuggestion(documentId, suggestionId)`
- `applyStylePreset(documentId, preset)`

Required safeguards:
- permission checks by client/matter/document
- preview-before-apply for larger agent edits
- audit logging for every agent mutation
- human-readable rationale for suggestions

Initial files:
- `server/document-agent/commands.ts`
- `server/document-agent/executeCommand.ts`
- `renderer/document/agent/useAgentDocumentActions.ts`

---

## 8. Data Model And Source-Of-Truth Rules

Use this split from day one.

### Canonical live-edit representation
- ProseMirror/Tiptap structured document state
- synchronized through Yjs

### Durable workflow metadata
- PostgreSQL rows for comments, versions, approvals, exports, and audit events

### Exchange/import formats
- DOCX in
- PDF in
- DOCX out later
- PDF out

### Do not do this
- do not make HTML the source of truth
- do not make DOCX the source of truth
- do not make agent prompts the source of truth

---

## 9. Suggested First Implementation Sequence

### Phase 1: Single-user editor foundation
Build:
- React document workspace in Electron
- Tiptap editor with base schema
- save/load structured JSON
- document metadata in PostgreSQL

Success condition:
- a lawyer can create, open, edit, and save a draft

### Phase 2: Collaboration foundation
Build:
- Yjs integration
- Hocuspocus server
- presence indicators
- periodic snapshot persistence

Success condition:
- two clients see the same document update live

### Phase 3: Legal review foundation
Build:
- comments
- suggestion objects
- review sidebar
- agent action log

Success condition:
- an attorney can review, comment, and inspect AI edits safely

### Phase 4: Import and viewing
Build:
- Mammoth-based DOCX import worker
- pdf.js viewer
- import reports

Success condition:
- external docs enter the system cleanly enough to begin drafting and review

### Phase 5: Legal polish
Build:
- numbering stability
- clause blocks
- defined terms
- citation anchors
- better redline/suggestion rendering

Success condition:
- the product feels legal-specific rather than generic

---

## 10. Minimal Folder Plan For The Current Repo

Because this repository currently has a simple Electron shell and Express backend, use a structure like this:

- `renderer/document/...` for React document UI
- `renderer/document/editor/...` for Tiptap/ProseMirror code
- `renderer/document/collab/...` for Yjs provider wiring
- `renderer/document/pdf/...` for pdf.js components
- `server/collab/...` for Hocuspocus setup and persistence
- `server/documents/...` for document APIs and services
- `server/importers/docx/...` for Mammoth import pipeline
- `server/jobs/...` for BullMQ queues and workers
- `server/storage/postgres/...` for DB access and migrations
- `shared/document-contracts/...` for request/response and command contracts

This keeps the editor stack isolated and understandable.

---

## 11. What “Working Right Off The Bat” Actually Means

A correct v1 does not need all of Word.
A correct v1 needs the following to work reliably on day one:

1. open a document
2. edit rich text
3. save and reload
4. collaborate live
5. import a DOCX into a useful draft
6. open a PDF in the same workspace
7. let the agent make structured, logged changes
8. let a human review those changes safely

If those eight things work, Equal Scales has the right base.

---

## 12. Final Recommendation

For the permissive-license Equal Scales document stack:

Use now:
- React for workspace UI
- Tiptap for editor ergonomics
- ProseMirror for schema and transactions
- Yjs for collaborative state
- Hocuspocus for collaboration transport/server
- PostgreSQL for durable metadata and version history
- BullMQ for async document jobs
- Mammoth for DOCX ingestion
- pdf.js for PDF review

Do not rely on now:
- Tiptap Pro
- ONLYOFFICE-style embedded suites
- page-perfect DOCX fidelity promises
- browser-DOM automation by the agent
- Next.js as a mandatory first step

The winning shape is not “clone Word.”
The winning shape is “build a legal drafting and review system that feels familiar to Word users while remaining agent-native, matter-scoped, and licensing-safe.”

---

## 13. Reference Links

- Tiptap overview: https://tiptap.dev/docs/editor/getting-started/overview
- ProseMirror guide: https://prosemirror.net/docs/guide/
- Yjs docs: https://docs.yjs.dev/
- Hocuspocus overview: https://tiptap.dev/docs/hocuspocus/getting-started/overview
- Yjs demos: https://github.com/yjs/yjs-demos
- Outline rich markdown editor: https://github.com/outline/rich-markdown-editor

---

## 14. Next Step

After this document, the next implementation artifact should be a file-by-file execution plan for Phase 1 and Phase 2:
- exact dependencies to add
- exact files to create
- exact APIs to expose
- exact first milestone to demo inside the current Equal Scales app

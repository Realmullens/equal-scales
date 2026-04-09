# Equal Scales Document Stack Phase 1–2 Execution Plan

> For Hermes / Claude Code / Codex / any coding agent: this is the execution plan for the first two implementation phases of the Equal Scales document stack. Read this together with the architecture documents before touching the code. Do not introduce non-permissive dependencies into the document stack.

## Related documents

Read these first:
- `docs/plans/2026-04-08-equal-scales-mempalace-architecture.md`
- `docs/plans/2026-04-09-equal-scales-permissive-document-stack-implementation-guide.md`

This file exists to turn those broader architecture decisions into concrete build steps.

---

## Goal

Ship the first working document system inside the current Equal Scales Electron app with these capabilities:
- open a document workspace inside the app
- edit rich text with a controlled schema
- save and reload structured document state
- collaborate live across two clients on the same document
- keep document access scoped to the correct matter
- establish the backend primitives needed for later comments, suggestions, PDF review, and agent-driven edits

---

## Scope

## In scope for Phase 1
- React document workspace embedded in the current Electron renderer
- Tiptap editor with a minimal ProseMirror schema
- document CRUD endpoints
- PostgreSQL-backed document metadata and snapshots
- structured JSON save/load loop
- shared document contracts and types

## In scope for Phase 2
- Yjs document state
- Hocuspocus server
- authentication and authorization for collaboration sessions
- presence tracking
- snapshot persistence for shared docs
- basic live multi-user editing demo

## Out of scope for these two phases
- comments and suggestions UI
- track changes / redlines
- DOCX import/export
- PDF viewing
- final legal numbering system
- advanced clause blocks
- full agent editing command library

Those come after the Phase 1–2 foundation is stable.

---

## Target architecture for these phases

### Frontend
- Electron renderer hosts the Equal Scales UI
- React mounts a dedicated document workspace
- Tiptap renders the editing canvas

### Backend
- Existing Express app grows document APIs
- Hocuspocus runs as a collaboration service beside Express
- PostgreSQL stores durable document metadata and snapshots

### Data model in these phases
- canonical editable document body: ProseMirror/Tiptap JSON
- collaborative state: Yjs document
- durable app metadata: PostgreSQL rows

---

## Recommended dependencies

Add only what is needed for the first two phases.

### Renderer / app dependencies
- `react`
- `react-dom`
- `@tiptap/core`
- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-link`
- `@tiptap/extension-underline`
- `@tiptap/extension-table`
- `@tiptap/extension-table-row`
- `@tiptap/extension-table-cell`
- `@tiptap/extension-table-header`
- `yjs`
- `y-prosemirror`
- `@hocuspocus/provider`

### Backend dependencies
- `pg`
- `@hocuspocus/server`
- `@hocuspocus/extension-database` if useful, though a custom persistence layer is acceptable
- `ws` if needed by surrounding integration code

### Optional but helpful for developer ergonomics
- `zod` for shared runtime contract validation

Do not add:
- Tiptap Pro
- ONLYOFFICE
- non-permissive office/document SDKs

---

## Proposed folder structure

Create the document system in clearly separated folders.

### Renderer side
- `renderer/document/index.tsx`
- `renderer/document/DocumentWorkspace.tsx`
- `renderer/document/components/DocumentHeader.tsx`
- `renderer/document/components/DocumentToolbar.tsx`
- `renderer/document/components/DocumentCanvas.tsx`
- `renderer/document/components/OutlineSidebar.tsx`
- `renderer/document/components/ReviewSidebar.tsx`
- `renderer/document/editor/createEditor.ts`
- `renderer/document/editor/extensions/baseExtensions.ts`
- `renderer/document/editor/schema/documentSchema.ts`
- `renderer/document/editor/commands/index.ts`
- `renderer/document/collab/connectCollabProvider.ts`
- `renderer/document/collab/createYDoc.ts`
- `renderer/document/api/documents.ts`
- `renderer/document/types.ts`

### Shared contracts
- `shared/document-contracts/document.ts`
- `shared/document-contracts/collab.ts`

### Backend side
- `server/routes/documents.js`
- `server/services/document-service.js`
- `server/services/document-snapshot-service.js`
- `server/services/document-authz-service.js`
- `server/collab/hocuspocusServer.js`
- `server/collab/persistence.js`
- `server/collab/document-name.js`
- `server/storage/postgres/client.js`
- `server/storage/postgres/migrations/001_documents.sql`

If TypeScript is introduced, use `.ts` consistently in the new document subsystem.
If the repo remains JavaScript-first, keep it JavaScript but preserve the same structure.

---

## Phase 1 — single-user structured editor

## Objective

Give Equal Scales a real document workspace that can open, edit, save, and reload a structured rich-text document using a controlled schema.

## Success criteria
- a user can open a document route/view in the app
- the editor loads a document from the backend
- the user can type and format text
- save persists the structured document JSON to PostgreSQL
- reload restores the document exactly
- the document is associated with a matter ID

## Phase 1 tasks

### Task 1: add a document workspace route in the renderer

Build:
- a mounted document workspace view in the Electron renderer
- a simple placeholder layout with header, toolbar area, canvas, and sidebars

Implementation notes:
- keep chat-centered navigation intact
- this workspace should be reachable from a document/draft selection action
- do not block on final design polish

Verification:
- app can navigate into a document workspace shell without errors

### Task 2: mount React in the document workspace

Build:
- React-powered document UI mounted into the renderer
- clear state ownership boundaries

Implementation notes:
- React should own pane layout and UI controls
- editor content state should still be owned by Tiptap/ProseMirror

Verification:
- workspace renders from React components, not handwritten DOM fragments

### Task 3: build the base Tiptap editor

Build:
- `createEditor` helper
- base extension list
- editable canvas component

Start with:
- paragraph
- heading
- bold
- italic
- underline
- link
- bullet list
- ordered list
- blockquote
- horizontal rule
- hard break
- table

Verification:
- user can type, format, and inspect the editor without runtime errors

### Task 4: define the first controlled schema

Build:
- base schema file or extension composition layer
- a single source of truth for the allowed document structure

Rules:
- do not accept arbitrary pasted HTML as canonical state
- normalize content into allowed nodes and marks
- keep the first schema intentionally narrow

Verification:
- stored documents serialize consistently
- unsupported content does not create editor corruption

### Task 5: implement document CRUD APIs

Build backend endpoints for:
- create document
- get document
- update document snapshot
- list documents by matter

Suggested API shape:
- `POST /api/documents`
- `GET /api/documents/:documentId`
- `PUT /api/documents/:documentId`
- `GET /api/matters/:matterId/documents`

Suggested request/response fields:
- `id`
- `matterId`
- `title`
- `status`
- `contentJson`
- `updatedAt`

Verification:
- API returns structured JSON documents cleanly

### Task 6: add PostgreSQL document tables

Create at minimum:
- `documents`
- `document_snapshots`

Suggested columns:

`documents`
- `id`
- `matter_id`
- `title`
- `status`
- `latest_snapshot_id`
- `created_at`
- `updated_at`

`document_snapshots`
- `id`
- `document_id`
- `snapshot_json`
- `created_by`
- `created_at`
- `source`

Implementation rule:
- snapshots must preserve structured editor JSON as JSONB, not text blobs if PostgreSQL JSONB is available

Verification:
- creating/updating a document writes rows correctly

### Task 7: wire save/load in the UI

Build:
- load document on workspace open
- save button or auto-save loop
- optimistic status indicator

Rules:
- start with explicit save if needed, then add auto-save
- preserve a clean separation between current editor state and last persisted snapshot

Verification:
- user can edit, save, reload, and see the same content

### Task 8: enforce matter-scoped access on document APIs

Build:
- document authz service
- matter-based access checks for all document routes

Rules:
- do not allow direct document access without matter validation
- prepare the same authz layer for later collab and agent commands

Verification:
- wrong-matter access is rejected

### Task 9: create a demo seed path

Build:
- a seeded demo matter and a seeded document record or a quick-create document action

Verification:
- a coding agent or developer can launch the app and reach a working demo document fast

---

## Phase 2 — live collaboration foundation

## Objective

Turn the single-user structured editor into a real-time collaborative workspace using Yjs and Hocuspocus while keeping access scoped and persistence sane.

## Success criteria
- two app instances can open the same document
- edits sync live between them
- presence shows that both are connected
- unauthorized access is rejected
- shared document state can be restored from persistence

## Phase 2 tasks

### Task 1: introduce a Yjs document wrapper

Build:
- one Y.Doc per document session
- helper for binding the editor to a Yjs document

Rules:
- document content sync belongs in Yjs
- UI-only local state should remain local unless it truly needs collaboration

Verification:
- local editor works with Yjs binding enabled

### Task 2: create the Hocuspocus server

Build:
- a collaboration server module that starts with the backend
- clean lifecycle management

Required hooks:
- auth hook
- document load hook
- document store hook
- connection lifecycle logging

Verification:
- backend starts both API service and collaboration service

### Task 3: define the collab room naming strategy

Build:
- deterministic mapping from Equal Scales `document_id` to Hocuspocus document name

Rule:
- do not expose raw ambiguous identifiers when a namespaced format is clearer

Suggested format:
- `equal-scales:document:{documentId}`

Verification:
- all clients for the same document join the same room

### Task 4: add collaboration authentication and authorization

Build:
- token-based auth for provider connection
- access validation against matter/document permissions

Rule:
- reuse the same authorization logic used by document CRUD APIs

Verification:
- unauthorized users cannot connect to a document room

### Task 5: wire the Hocuspocus provider into the React workspace

Build:
- provider connection helper
- reconnect handling
- connection state indicator

UI states to support:
- connecting
- connected
- reconnecting
- disconnected

Verification:
- workspace visibly reflects collaboration state

### Task 6: add awareness and presence

Build:
- user identity in awareness payload
- presence indicator in the workspace header or status bar

Initial presence fields:
- user id
- display name
- color
- current document id

Verification:
- two connected users can see each other present in the same doc

### Task 7: persist snapshots from collaboration state

Build:
- on-load document hydration from the latest durable snapshot
- periodic snapshot persistence from collab state

Rules:
- do not write a full snapshot on every keystroke
- persist snapshots on a debounce interval, explicit save, disconnect, or major checkpoint

Verification:
- collaborative state survives reconnect/reopen

### Task 8: record collaboration session metadata

Create table:
- `document_presence_sessions`

Suggested columns:
- `id`
- `document_id`
- `user_id`
- `connected_at`
- `disconnected_at`
- `session_metadata`

Verification:
- backend can inspect who connected to a doc and when

### Task 9: test cross-window collaboration

Demo requirement:
- launch two app sessions
- open the same document in both
- edit in one and observe updates in the other
- disconnect/reconnect one client and confirm state restoration

Verification:
- collaboration loop is demoable and stable enough to build on

---

## Suggested database migration outline

### Migration 001
Create:
- `documents`
- `document_snapshots`
- `document_presence_sessions`

Add indexes for:
- `documents(matter_id)`
- `document_snapshots(document_id, created_at desc)`
- `document_presence_sessions(document_id, connected_at desc)`

---

## API contract suggestions

### Create document
`POST /api/documents`

Request:
```json
{
  "matterId": "matter_123",
  "title": "Draft Motion to Compel"
}
```

Response:
```json
{
  "id": "doc_123",
  "matterId": "matter_123",
  "title": "Draft Motion to Compel",
  "status": "draft",
  "contentJson": { "type": "doc", "content": [] },
  "updatedAt": "2026-04-09T00:00:00.000Z"
}
```

### Update document snapshot
`PUT /api/documents/:documentId`

Request:
```json
{
  "contentJson": {
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [{ "type": "text", "text": "Hello world" }] }
    ]
  }
}
```

---

## UI contract suggestions

At minimum, the Phase 1–2 workspace should display:
- document title
- matter name / matter context
- save state
- collaboration state
- presence count
- editor canvas
- placeholder outline/review panels

This matters because it preserves the final product shape even before review features are fully built.

---

## Guardrails for coding agents

1. Do not introduce commercial editor add-ons.
2. Do not collapse editor state into arbitrary HTML.
3. Do not bypass matter-scoped authorization.
4. Do not make Yjs the only durable storage layer.
5. Do not put comments/suggestions into ephemeral awareness state.
6. Do not entangle the agent command layer with raw DOM manipulation.
7. Keep the file structure modular so later comments, redlines, PDF review, and DOCX import can slot in without rewrites.

---

## Definition of done for Phase 1–2 combined

This phase pair is complete when:
- the Equal Scales app has a working document workspace
- structured documents can be created, edited, saved, and reloaded
- the editor is backed by a controlled schema
- documents are stored with matter-scoped metadata in PostgreSQL
- two users can collaborate live on the same document
- collab sessions are authenticated and scoped correctly
- shared state survives reconnects through persistence

At that point, the stack is ready for Phase 3 features:
- comments
- suggestions/redlines
- DOCX import
- PDF review
- agent document commands

---

## Recommended next document after this one

After Phase 1–2 begin, create a fourth doc for Phase 3–5 covering:
- comments and review
- suggestion mode / redlines
- Mammoth DOCX import
- pdf.js review surfaces
- legal-specific blocks and numbering
- structured AI command execution

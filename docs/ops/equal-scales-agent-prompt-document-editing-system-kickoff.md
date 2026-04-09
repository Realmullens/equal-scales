# Agent Prompt — Kick Off the Equal Scales Document Editing System

Paste the following into your coding agent.

---

You are working inside the Equal Scales repository at:
`/Users/bailey/Projects/open-claude-cowork`

Your assignment is to begin implementing the Equal Scales document editing system using the approved architecture and permissive-license stack already documented in the repo.

This is not a generic rich text editor task.
This is the beginning of a matter-centered legal document workspace for Equal Scales.

## Required reading before doing anything else

Read these files in order:

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/vision/equal-scales-master-product-vision.md`
4. `docs/roadmap/equal-scales-product-roadmap.md`
5. `docs/architecture/equal-scales-domain-model.md`
6. `docs/architecture/equal-scales-information-architecture.md`
7. `docs/plans/2026-04-08-equal-scales-mempalace-architecture.md`
8. `docs/plans/2026-04-08-equal-scales-template-first-implementation-spec.md`
9. `docs/plans/2026-04-09-equal-scales-permissive-document-stack-implementation-guide.md`
10. `docs/plans/2026-04-09-equal-scales-document-stack-phase-1-2-execution-plan.md`
11. `docs/ops/equal-scales-live-build-loop.md`
12. `docs/ops/equal-scales-outcome-tests.md`
13. `docs/ops/equal-scales-milestones.md`
14. `docs/ops/equal-scales-agent-runbook-codex.md` or `docs/ops/equal-scales-agent-runbook-claude-code.md` depending on which agent you are

After reading, inspect the current codebase before proposing changes.

## Approved document stack

Use this stack unless a documented repo file explicitly supersedes it:
- Electron app shell
- React document workspace
- Tiptap core
- ProseMirror
- Yjs
- Hocuspocus
- PostgreSQL
- BullMQ
- Mammoth later for DOCX import
- pdf.js later for PDF review

Important:
- do not add Tiptap Pro
- do not add ONLYOFFICE or other commercial office suites
- do not add non-permissive core document dependencies
- do not use brittle DOM automation for document editing

## Product constraints

Equal Scales must remain:
- matter-centered
- assistant-led
- local-first / inspectable where appropriate
- structured and reviewable for AI actions
- licensing-disciplined

This means:
- document actions should be scoped to the active matter by default
- the assistant should eventually be able to control document actions through structured commands
- the editor must not become a generic unscoped note editor

## What to build now

Your goal is to begin the document editing system by implementing the first practical foundation slice from the approved plan.

The first target is the document workspace foundation corresponding to the Phase 1–2 document plan.

Build the beginning of:
- a React-powered document workspace mounted inside the current Electron app
- a Tiptap editor shell with a controlled base schema
- a save/load path for structured document JSON
- document CRUD plumbing on the backend
- durable metadata/snapshot storage aligned with the approved architecture

## What success looks like for this kickoff

A successful kickoff should produce the first working vertical slice of the document system, not the whole final editor.

That means the app should be able to:
1. open a document workspace inside Equal Scales
2. render a structured editor shell
3. load a document record from the backend
4. allow editing of structured rich text
5. save and reload the structured document state
6. preserve association to the correct matter

## In scope for this kickoff

- document workspace shell
- React mount strategy if it does not already exist for this surface
- Tiptap editor initialization
- controlled extension/schema setup
- document CRUD API groundwork
- persistence of structured content JSON
- minimal document metadata model and storage
- narrow verification proving the editing loop works

## Out of scope for this kickoff

Do NOT try to complete all later phases.
Specifically out of scope unless trivially required:
- comments UI
- suggestions / redlines
- collaboration sync
- DOCX import
- PDF review
- advanced legal numbering
- full agent document command layer
- final visual polish

## Suggested implementation shape

Follow the existing documented folder direction unless inspection of the repo requires a small adjustment:

Renderer side:
- `renderer/document/index.tsx`
- `renderer/document/DocumentWorkspace.tsx`
- `renderer/document/components/DocumentHeader.tsx`
- `renderer/document/components/DocumentToolbar.tsx`
- `renderer/document/components/DocumentCanvas.tsx`
- `renderer/document/editor/createEditor.ts`
- `renderer/document/editor/extensions/baseExtensions.ts`
- `renderer/document/editor/schema/documentSchema.ts`

Shared contracts if appropriate:
- `shared/document-contracts/document.ts`

Backend side:
- `server/routes/documents.js`
- `server/services/document-service.js`
- `server/services/document-snapshot-service.js`
- DB migration/schema updates as needed

If the repo is not yet ready for this exact structure, adapt minimally and explain why.

## Acceptance criteria

### AC1 — document workspace exists
A user can open a dedicated document workspace inside the app.

### AC2 — editor shell mounts cleanly
The document workspace renders a Tiptap-based editor without fatal runtime errors.

### AC3 — structured content is used
The editor content is persisted as structured JSON / editor state, not only loose HTML.

### AC4 — document save/load works
A document can be created or loaded, edited, saved, and reloaded successfully.

### AC5 — matter association is preserved
The document remains associated with the correct matter in storage and API flow.

### AC6 — changes are bounded
The implementation stays within the kickoff slice and does not sprawl into later phases.

## Verification requirements

At minimum, verify:
- backend boots
- renderer boots
- document workspace renders
- document create/load/save/reload path works
- no obvious matter-scoping regression was introduced

If tests or scripts are possible, add them.
If a lightweight smoke verification is more realistic for the current repo shape, perform that and document it clearly.

## Required workflow

1. Read the docs.
2. Inspect the codebase.
3. Restate the kickoff slice in your own words.
4. Provide a concise implementation plan listing exact files to create/modify.
5. Implement only the kickoff slice.
6. Run verification.
7. Update `docs/ops/equal-scales-live-build-loop.md` with:
   - what you changed
   - what you verified
   - whether AC1–AC6 passed
   - the next recommended document-system slice

## Rules

- Do not invent a different stack.
- Do not add non-permissive dependencies.
- Do not treat the document workspace as a generic detached editor.
- Do not bypass matter/document structure for speed.
- Do not stop after only writing a plan — implement the kickoff slice.
- Do not continue into later phases after the kickoff slice is complete.

## Final instruction

Implement the first working document editing system kickoff slice for Equal Scales using the documented stack and architecture, verify it, update the live build loop, and then stop with a concise summary of completed work and the recommended next slice.

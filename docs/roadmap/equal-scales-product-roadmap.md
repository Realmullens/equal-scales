# Equal Scales Product Roadmap

> For coding agents and planners: this document explains the intended implementation sequence for Equal Scales at the product level. Use it to understand what comes first, what comes later, and what should not be overbuilt too early.

## 1. Roadmap purpose

This roadmap exists to prevent architecture drift and bad sequencing.
A coding agent should be able to read this and understand:
- what the product must prove first
- what should be built before the document stack becomes ambitious
- how document editing fits into the broader platform
- what later differentiators depend on earlier foundations

---

## 2. Roadmap principles

1. Build the legal workflow before building maximum editor complexity.
2. Build matter-centered structure before broad automation.
3. Build inspectable storage and permissions before scaling features.
4. Build the structured document foundation before Word-grade polish.
5. Keep the assistant central in every phase.

---

## 3. Phase map overview

### Phase 0 — shell adaptation and foundation
Already partially underway.

Focus:
- rebrand the shell from Open Claude Cowork to Equal Scales
- preserve the current streaming chat runtime
- stabilize local-first backend boot
- keep degraded mode working without unnecessary external dependencies

What success looks like:
- the existing app can serve as the shell for Equal Scales work

### Phase 1 — local legal workspace foundation
Focus:
- local vault strategy
- SQLite / local persistence foundations where appropriate
- clients, matters, templates, drafts, conversations, messages
- first backend repositories and storage boundaries

What success looks like:
- the app has first-class legal workspace objects instead of only generic chats

### Phase 2 — template-first legal drafting MVP
Focus:
- client workspaces
- matter workspaces
- local template library
- draft generation from templates
- chat-driven navigation across those objects

What success looks like:
- a lawyer can create a matter, select a template, generate a draft, and iterate in a matter-scoped workflow

### Phase 3 — document workspace foundation
Focus:
- React document workspace
- Tiptap + ProseMirror structured editor
- document CRUD
- PostgreSQL-backed document metadata and snapshots if/when the document stack is separated from the earlier local vault data path
- first save/load loop

What success looks like:
- Equal Scales has a working structured editor inside the app

### Phase 4 — collaboration foundation
Focus:
- Yjs document state
- Hocuspocus server
- presence
- document persistence for collaborative state
- authenticated matter-scoped collaboration

What success looks like:
- two users or sessions can collaborate in the same draft safely

### Phase 5 — review foundation
Focus:
- comments
- suggestions
- review sidebar
- version snapshots and compare surfaces
- agent action logs for document edits

What success looks like:
- a lawyer can safely review AI and human changes

### Phase 6 — legal document operations
Focus:
- DOCX import via permissive tooling
- PDF review surfaces
- legal numbering stabilization
- clause blocks and defined terms
- stronger source linking

What success looks like:
- external legal documents can be brought into Equal Scales and worked on productively

### Phase 7 — agent-native legal workbench
Focus:
- structured document commands for the assistant
- source-backed suggestions
- review orchestration
- matter-level automation flows
- deeper legal workflow intelligence

What success looks like:
- the assistant feels like a legal coworker operating across the full matter workspace, not just a text generator

---

## 4. What each phase must not overbuild

### Phase 1 should not overbuild
- full document editor
- full new frontend rewrite
- cloud-first architecture

### Phase 2 should not overbuild
- Word-grade fidelity
- advanced review UI
- broad automation without scoped matter models

### Phase 3 should not overbuild
- comments/redlines before structured persistence works
- expensive fidelity work before the editing loop is stable

### Phase 4 should not overbuild
- massive scaling assumptions before the collaboration model is proven locally

### Phase 5 should not overbuild
- every possible review workflow before core comments/suggestions work cleanly

---

## 5. Core deliverables by phase

## Phase 1 deliverables
- local storage/vault design
- first durable legal entities
- repository layer
- persistence bootstrap

## Phase 2 deliverables
- template library
- client/matter UI surfaces
- draft generation loop
- assistant-driven navigation across legal workspaces

## Phase 3 deliverables
- document workspace route/view
- structured editor shell
- document save/load loop
- controlled schema

## Phase 4 deliverables
- collaborative editing
- authz-aware collaboration transport
- presence and persistence

## Phase 5 deliverables
- comments
- suggestions/redlines basis
- review sidebar
- version history and comparison basis

## Phase 6 deliverables
- import and PDF review capabilities
- legal drafting ergonomics improvements

## Phase 7 deliverables
- robust assistant command layer
- review-safe AI editing
- broader matter workflow automation

---

## 6. The roadmap relationship between templates and documents

This is important.

Equal Scales should not treat template-first and document-stack work as competing directions.
They are sequential and compatible.

Template-first work proves:
- the legal workflow
- the matter model
- the assistant-led navigation model
- the value of local drafting assets

The document stack later provides:
- a stronger editing surface
- collaboration
- review
- document-grade legal polish

So the correct interpretation is:
- templates and drafts come first
- structured editor and review deepen the system later
- both belong to the same long-term product

---

## 7. Decision rules for future agents

When choosing what to implement next, use these rules:

1. Does this strengthen matter-centered legal workflows?
2. Does this keep the assistant central instead of peripheral?
3. Does this preserve inspectable and durable architecture?
4. Does this follow the sequencing above?
5. Does this avoid non-permissive core dependencies?

If the answer is no to several of these, the work probably belongs later or not at all.

---

## 8. Current highest-priority document work

As of now, the current highest-priority document-specific work is:
- single-user structured document workspace
- save/load loop
- collaboration foundation
- authz and persistence discipline

That is the correct next step after the planning documents already in the repo.

---

## 9. Canonical use of this roadmap

Use this roadmap with:
- `docs/vision/equal-scales-master-product-vision.md`
- `docs/plans/2026-04-08-equal-scales-template-first-implementation-spec.md`
- `docs/plans/2026-04-08-equal-scales-mempalace-architecture.md`
- `docs/plans/2026-04-09-equal-scales-document-stack-phase-1-2-execution-plan.md`

The roadmap tells you when to do something.
The other docs tell you why and how.

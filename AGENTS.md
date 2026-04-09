# AGENTS.md

> Start here if you are a coding agent working inside the Equal Scales project.

## Project identity

This repository is being adapted into Equal Scales, a legal co-working and legal assistant platform.

Equal Scales is not a generic chat app and not a generic document editor.
It is a matter-centered legal workspace where the assistant is the primary control surface for navigating work across:
- clients
- matters
- templates
- drafts
- research
- review workflows

## Non-negotiable product rules

1. Keep the product matter-centered.
   - Retrieval, navigation, and document access should default to the active client/matter scope.
   - Do not weaken matter/client boundaries.

2. Keep the assistant as the primary UI control surface.
   - New features should work with the chat-centered UX, not fight against it.
   - The assistant should be able to drive navigation and document actions through structured product actions.

3. Preserve permissive-license discipline.
   - For the production document stack, use MIT and other clearly permissive licenses only unless Bailey explicitly approves otherwise.
   - Do not add Tiptap Pro, commercial office suites, or ambiguous/non-permissive document dependencies into the core stack.

4. Agent document editing must be structured.
   - Do not use brittle DOM automation for editor control.
   - Agent-driven document changes must go through structured commands and transaction-based editor APIs.

5. Favor durable, inspectable architecture.
   - Store architectural guidance and implementation plans in markdown inside this repo.
   - Keep code organization clear enough that future coding agents can understand it quickly.

## Required document read order

Before making architecture or implementation decisions, read these files in order:

1. `docs/README.md`
2. `docs/vision/equal-scales-master-product-vision.md`
3. `docs/roadmap/equal-scales-product-roadmap.md`
4. `docs/architecture/equal-scales-domain-model.md`
5. `docs/architecture/equal-scales-information-architecture.md`
6. `docs/plans/2026-04-08-equal-scales-mempalace-architecture.md`
7. `docs/plans/2026-04-08-equal-scales-template-first-implementation-spec.md`
8. `docs/plans/2026-04-09-equal-scales-permissive-document-stack-implementation-guide.md`
9. `docs/plans/2026-04-09-equal-scales-document-stack-phase-1-2-execution-plan.md`

## Current preferred document stack

Use this stack unless Bailey explicitly changes direction:
- Electron app shell
- React document workspace
- Tiptap core + ProseMirror
- Yjs + Hocuspocus
- PostgreSQL
- BullMQ
- Mammoth for DOCX import later
- pdf.js for PDF review later

## Current implementation priorities

Current priority is building the document foundation in the existing app, in this order:
1. single-user structured editor workspace
2. collaboration foundation
3. comments and review flows
4. DOCX import and PDF review
5. legal-specific drafting and review polish

## What not to do

- Do not introduce non-permissive document tooling without approval.
- Do not turn the source of truth into raw HTML blobs.
- Do not make DOCX the canonical live editing format.
- Do not bypass matter-scoped authorization.
- Do not build features that assume the app is a generic note-taking tool.
- Do not bury important architectural decisions only in chat history.

## Documentation maintenance rule

If you change the architecture, implementation order, or required stack, update the markdown docs in `docs/` so the next coding agent inherits the correct instructions.

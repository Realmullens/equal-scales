# Equal Scales

Equal Scales is a matter-centered legal co-working and legal assistant platform.

It is being built by adapting the Open Claude Cowork application shell into a legal workspace where the assistant is the primary control surface for navigating work across:
- clients
- matters
- templates
- drafts
- documents
- research
- review workflows

## What Equal Scales is

Equal Scales is not a generic AI chat wrapper and not a generic document editor.
It is intended to become:
- a local-first legal workspace
- a matter-scoped drafting and review environment
- an assistant-led application where chat can drive navigation and actions
- a trustworthy system for legal work with inspectable architecture and durable records

## Current product direction

The current implementation direction is:
1. preserve the chat-centered shell
2. establish first-class legal workspace objects like clients, matters, templates, and drafts
3. support template-first legal drafting workflows
4. add a structured document workspace
5. add collaboration and review capabilities
6. evolve toward an agent-native legal workbench

## Core product principles

- Matter-centered by default
  - retrieval, navigation, and document access should default to the active client/matter scope
- Assistant as the primary control surface
  - the user should be able to drive work from chat while the UI navigates and reshapes around the task
- Local-first and inspectable
  - important legal workflow data should be stored in durable, understandable forms inside the project architecture
- Structured, reviewable AI actions
  - the assistant should not make invisible edits through brittle DOM hacks
- Permissive-license discipline
  - core production document infrastructure should use MIT and other clearly permissive licenses unless explicitly approved otherwise

## Current preferred document stack

The current preferred stack for the document system is:
- Electron app shell
- React document workspace
- Tiptap core + ProseMirror
- Yjs + Hocuspocus
- PostgreSQL
- BullMQ
- Mammoth for DOCX import later
- pdf.js for PDF review later

## Documentation

Start with these files if you are working in the repo:

- `AGENTS.md`
- `docs/README.md`
- `docs/vision/equal-scales-master-product-vision.md`
- `docs/roadmap/equal-scales-product-roadmap.md`
- `docs/architecture/equal-scales-domain-model.md`
- `docs/architecture/equal-scales-information-architecture.md`

Important planning docs:
- `docs/plans/2026-04-08-equal-scales-mempalace-architecture.md`
- `docs/plans/2026-04-08-equal-scales-template-first-implementation-spec.md`
- `docs/plans/2026-04-09-equal-scales-permissive-document-stack-implementation-guide.md`
- `docs/plans/2026-04-09-equal-scales-document-stack-phase-1-2-execution-plan.md`

## Current repository shape

This repository currently contains the adapted Equal Scales shell and supporting backend services.

Main areas:
- `main.js` — Electron main process
- `renderer/` — renderer-side UI
- `server/` — backend services and storage code
- `docs/` — architecture, roadmap, and implementation docs
- `AGENTS.md` — coding-agent instructions and read order

## Development status

This project is in active architectural and implementation planning while the base shell is being adapted into the Equal Scales product.

What is already true:
- the app has been reoriented toward Equal Scales branding and direction
- the docs now define the product vision, roadmap, domain model, information architecture, and document stack
- implementation planning exists for both the template-first legal workspace and the early document stack

What is still in progress:
- moving from generic chat/session structures toward first-class legal workspace objects
- building the structured document workspace
- adding collaboration, review, and legal-specific document behavior

## Local development

Current app startup remains based on the existing Electron + backend workflow.

Typical local run flow:

```bash
# terminal 1
cd server
npm start

# terminal 2
npm start
```

If additional setup is required, inspect:
- `.env.example`
- `package.json`
- `server/package.json`
- `setup.sh`

## Guidance for coding agents

If you are a coding agent:
- do not assume the old Open Claude Cowork README represents the current product direction
- use `AGENTS.md` and `docs/README.md` as the authoritative entry points
- keep Equal Scales matter-centered, assistant-led, and licensing-disciplined
- update the docs if you materially change architecture or sequencing

## Status note

This README is the project-level overview.
The canonical detailed guidance lives in `docs/`.

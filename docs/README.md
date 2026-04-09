# Equal Scales Documentation Index

> For coding agents: start here before making architectural or implementation changes anywhere in the Equal Scales project.

This folder is the durable source of product, architecture, roadmap, and implementation guidance for Equal Scales.

## Core rules

Equal Scales must stay aligned with these principles:
- matter-centered legal workflows
- assistant as the primary control surface
- local-first and inspectable architecture
- structured, reviewable AI actions
- MIT and other permissive licenses only for the core production document stack unless explicitly approved otherwise

---

## Recommended read order for coding agents

### Read first for full project vision

1. `docs/vision/equal-scales-master-product-vision.md`
   - canonical statement of what Equal Scales is
   - defines the product identity, user promise, and core principles

2. `docs/roadmap/equal-scales-product-roadmap.md`
   - explains product sequencing
   - clarifies what comes first, what comes later, and what should not be overbuilt too early

3. `docs/architecture/equal-scales-domain-model.md`
   - defines the core domain objects and their relationships
   - explains how clients, matters, templates, drafts, documents, reviews, and conversations fit together

4. `docs/architecture/equal-scales-information-architecture.md`
   - defines the main workspace surfaces and navigation model
   - explains how chat, matters, templates, documents, research, and review connect

### Read next for broader system architecture

5. `docs/plans/2026-04-08-equal-scales-mempalace-architecture.md`
   - broader platform architecture
   - local-first legal workspace rationale
   - retrieval and memory boundaries

6. `docs/plans/2026-04-08-equal-scales-template-first-implementation-spec.md`
   - explains the template-first near-term product direction
   - gives coding-agent implementation guidance for the legal workspace before the full editor stack

### Read next for the document stack

7. `docs/plans/2026-04-09-equal-scales-permissive-document-stack-implementation-guide.md`
   - explains the recommended permissive-license document stack
   - describes how to implement React, Tiptap, ProseMirror, Yjs, Hocuspocus, PostgreSQL, BullMQ, Mammoth, and pdf.js

8. `docs/plans/2026-04-09-equal-scales-document-stack-phase-1-2-execution-plan.md`
   - concrete implementation plan for the first document stack phases
   - first files, services, dependencies, APIs, and milestones

### Use as execution helpers

9. `docs/ops/equal-scales-agentic-development-loop.md`
   - recommended operating model for running Codex and Claude Code in a low-touch development loop
   - explains the living-loop document strategy, role split, verification layers, and milestone cadence

10. `docs/plans/phase-1-kickoff-prompt-for-claude-code.md`
   - kickoff prompt for handing specific implementation work to Claude Code

---

## Google Docs mirrors

These docs are also mirrored in Google Docs for easier collaboration and editing.

### 1. Equal Scales + MemPalace Architecture & Integration Plan
- Markdown source:
  - `docs/plans/2026-04-08-equal-scales-mempalace-architecture.md`
- Google Doc:
  - https://docs.google.com/document/d/1DreJOh93xpyCqPPqUXLdePLDfXw14VvsdlQpgNHLrCg/edit?usp=drivesdk

### 2. Equal Scales Permissive-License Document Stack Implementation Guide
- Markdown source:
  - `docs/plans/2026-04-09-equal-scales-permissive-document-stack-implementation-guide.md`
- Google Doc:
  - https://docs.google.com/document/d/1p_iLEJA8cue9IChWrZbzdHPcjMj8MWeoU_96EI3P8CY/edit?usp=drivesdk

### 3. Equal Scales Document Stack Phase 1–2 Execution Plan
- Markdown source:
  - `docs/plans/2026-04-09-equal-scales-document-stack-phase-1-2-execution-plan.md`
- Google Doc:
  - https://docs.google.com/document/d/1VepYssiObZqBxrx18LDvp7qEvhgkSW8j09U51ITSEO0/edit?usp=drivesdk

### 4. Equal Scales Master Product Vision
- Markdown source:
  - `docs/vision/equal-scales-master-product-vision.md`
- Google Doc:
  - https://docs.google.com/document/d/1Ekt-uJ-0ljM1QcjRk0pktQrQIJE6DT6GFhWZAD0slJ4/edit?usp=drivesdk

### 5. Equal Scales Product Roadmap
- Markdown source:
  - `docs/roadmap/equal-scales-product-roadmap.md`
- Google Doc:
  - https://docs.google.com/document/d/13MnLOQz2vdXXHvkvZBKYxwWZJ7TkiCJEK35bHEo47Fg/edit?usp=drivesdk

### 6. Equal Scales Domain Model
- Markdown source:
  - `docs/architecture/equal-scales-domain-model.md`
- Google Doc:
  - https://docs.google.com/document/d/14HV1wKAJXpyW9aXUPif-gO-DVscH4w2rB5xIx5l_gzI/edit?usp=drivesdk

### 7. Equal Scales Information Architecture and Navigation Model
- Markdown source:
  - `docs/architecture/equal-scales-information-architecture.md`
- Google Doc:
  - https://docs.google.com/document/d/1k_7a8iqAKuXE8AlP6jFaVzGLGsp_tLdE6IVWKdH2KG0/edit?usp=drivesdk

---

## How coding agents should use these docs

### If you are trying to understand the whole product
Read the first six documents in order before proposing major architecture changes.

### If you are implementing the template-first legal workspace
Use this sequence:
1. master product vision
2. roadmap
3. domain model
4. information architecture
5. template-first implementation spec

### If you are implementing the document stack
Use this sequence:
1. master product vision
2. roadmap
3. domain model
4. information architecture
5. mempalace/platform architecture
6. permissive document stack guide
7. phase 1–2 execution plan

### If you are making dependency decisions
You must preserve the permissive-license policy.
If a dependency is not clearly permissive, do not add it without approval.

### If you are building AI editing features
The agent must edit through structured document commands and transactions.
Do not rely on brittle DOM automation.

### If you are building retrieval or access control
All retrieval and document access must remain scoped to the correct client and matter by default.
Do not weaken those boundaries.

---

## What this docs folder should let an agent understand

Any future coding agent should be able to enter this project, read this folder, and understand:
- what Equal Scales is
- who it is for
- the product sequencing
- the domain model
- the navigation model
- the broader architecture
- the document stack choices
- the licensing constraints
- the implementation order
- the non-goals

If new core docs are added later, update this index.

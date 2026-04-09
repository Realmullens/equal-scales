# Equal Scales Milestones

> This file turns the roadmap into milestone-sized execution packages for the agentic development loop.

## How to use this file

- pick one milestone at a time
- do not start a later milestone before its dependencies are truly ready
- within each milestone, execute one bounded task per run unless the live loop explicitly chains multiple low-risk tasks
- update statuses here and in the live build loop doc when progress changes materially

Status options:
- `pending`
- `in_progress`
- `blocked`
- `done`

---

## Milestone 0 — Agentic loop operationalization
- Status: done
- Goal: make the repo self-directing enough for low-touch development
- Depends on: existing core docs

Tasks:
- create live loop doc — done
- create outcome tests doc — done
- create Codex runbook — done
- create Claude Code runbook — done
- create milestones tracker — done
- update doc indexes — done
- sync ops docs to Google Docs — done

Completion test:
- the repo contains the full operational loop system and updated doc entry points

---

## Milestone 1 — Legal workspace data foundation
- Status: done (167 total tests across 3 slices, 2026-04-09)
- Goal: establish durable first-class legal workspace entities
- Depends on: milestone 0

Tasks:
- Slice 01 — client and matter foundation hardening — done (41/41 tests, 2026-04-09)
- Slice 02 — template, draft, and conversation foundation hardening — done (62/62 tests, 2026-04-09)
- Slice 03 — vault filesystem integrity verification — done (64/64 tests, 2026-04-09)
- local vault path strategy
- initialize durable storage foundations
- clients repository
- matters repository
- templates repository
- drafts repository
- conversations/messages repository alignment

Outcome tests:
- OUTCOME-A1
- OUTCOME-A2
- OUTCOME-A3

---

## Milestone 2 — Template-first drafting MVP
- Status: in_progress (Slice 01 done: 74/74 tests, 2026-04-09)
- Goal: prove the matter-scoped drafting loop before advanced document features
- Depends on: milestone 1

Tasks:
- client workspace UI basis
- matter workspace UI basis
- template library browsing
- template-to-draft generation
- chat-driven navigation into template and draft flows

Outcome tests:
- OUTCOME-B1
- OUTCOME-B2
- OUTCOME-B3
- OUTCOME-B4
- OUTCOME-F1
- OUTCOME-F2

---

## Milestone 3 — Document workspace shell
- Status: pending
- Goal: create the first structured document workspace inside the app
- Depends on: milestone 2 or explicit approved parallel path

Tasks:
- React document workspace shell
- Tiptap editor mount
- controlled schema
- document CRUD routes
- structured save/load loop

Outcome tests:
- OUTCOME-C1
- OUTCOME-C2
- OUTCOME-C3

---

## Milestone 4 — Collaboration foundation
- Status: pending
- Goal: enable real-time collaborative document editing safely
- Depends on: milestone 3

Tasks:
- Yjs integration
- Hocuspocus service
- authz-aware collaboration connection
- presence handling
- snapshot persistence

Outcome tests:
- OUTCOME-D1
- OUTCOME-D2
- OUTCOME-D3
- OUTCOME-D4

---

## Milestone 5 — Review foundation
- Status: pending
- Goal: establish trustworthy human and AI review flows
- Depends on: milestone 4

Tasks:
- comments model
- suggestion model
- review sidebar
- durable agent action log
- basic version compare surface

Outcome tests:
- OUTCOME-E1
- OUTCOME-E2
- OUTCOME-E3
- OUTCOME-F3

---

## Milestone 6 — Legal document operations
- Status: pending
- Goal: make external legal document workflows practical
- Depends on: milestone 5

Tasks:
- DOCX import via Mammoth
- PDF review surface via pdf.js
- legal numbering stabilization
- clause/defined-term foundations

Outcome tests:
- relevant C, E, and G scenarios plus dedicated import/review checks added later

---

## Milestone 7 — Agent-native legal workbench
- Status: pending
- Goal: make the assistant a reliable operator of the legal workspace
- Depends on: milestones 2 through 6 foundations

Tasks:
- structured document command layer
- source-backed suggestions
- richer matter-wide navigation and workflow actions
- stronger review orchestration

Outcome tests:
- OUTCOME-C4
- OUTCOME-F1
- OUTCOME-F2
- OUTCOME-F3
- OUTCOME-G1
- OUTCOME-G2
- OUTCOME-G3

---

## Next recommended milestone sequence

Current recommendation:
1. finish Milestone 0
2. execute Milestone 1
3. execute Milestone 2
4. proceed into Milestone 3 and 4 for the document stack

---

## Rule for agents

Do not jump milestones just because a later task sounds more exciting.
Equal Scales should be built in an order that preserves the product logic and reduces rework.

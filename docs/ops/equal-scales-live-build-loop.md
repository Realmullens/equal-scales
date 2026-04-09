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
- Primary agents:
  - Claude Code = planner / reviewer / frontend lead
  - Codex = executor / backend lead
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

### Rule 4: Update docs as part of the work
If architecture, sequencing, or operating rules change, update the relevant docs before ending.

### Rule 5: Escalate only real product decisions
Do not ask Bailey routine implementation questions that the docs already answer.
Escalate only for true ambiguity, design forks, or licensing concerns.

---

## Verification log

### 2026-04-09
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

Execute Milestone 1 Slice 01: Client and Matter Foundation Hardening.

Execution package:
- task doc: `docs/ops/equal-scales-m1-slice-01-client-matter-foundation.md`
- Codex prompt: `docs/ops/equal-scales-m1-slice-01-codex-prompt.md`
- Claude Code prompt: `docs/ops/equal-scales-m1-slice-01-claude-code-prompt.md`

Expected result of the next run:
- the existing local legal workspace storage layer is verified and hardened
- the live build loop is updated with results
- the next Milestone 1 slice is recommended

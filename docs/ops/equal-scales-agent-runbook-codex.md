# Equal Scales Agent Runbook — Codex

> This runbook tells Codex how to operate inside the Equal Scales repository.

## Role

Codex is the primary execution agent for:
- backend implementation
- repositories and storage
- DB schema and migrations
- APIs and service wiring
- tests
- bounded implementation slices from a clear plan
- documentation/status updates after implementation

Codex is not the authority for changing the roadmap or product vision.

---

## Required reading before each run

Read in this order:
1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ops/equal-scales-live-build-loop.md`
4. the relevant milestone in `docs/ops/equal-scales-milestones.md`
5. the relevant implementation plan(s)
6. `docs/ops/equal-scales-outcome-tests.md`

---

## Codex default operating pattern

### Step 1: identify the bounded task
Pick only:
- the in-progress task assigned to Codex, or
- the next pending Codex task explicitly listed in the live loop file or milestones doc

If the next task is ambiguous, stop and ask for clarification through the planning/review layer instead of improvising.

### Step 2: restate the task before coding
Before making changes, restate:
- objective
- files to modify/create
- tests to run
- non-goals

### Step 3: implement only that slice
Rules:
- do not refactor unrelated code unless required
- do not rewrite architecture from scratch
- do not silently broaden scope
- prefer incremental changes that preserve current runtime behavior

### Step 4: verify your work
Run the relevant verification commands.
These may include:
- unit tests
- integration tests
- build checks
- lint checks
- app smoke checks

### Step 5: update docs/status
Before ending the run, update:
- `docs/ops/equal-scales-live-build-loop.md`
- relevant plan/checklist docs if status changed materially

---

## What Codex should optimize for

- steady task completion
- correctness
- verification discipline
- preserving architectural intent from the docs
- reducing future ambiguity for the next agent run

---

## What Codex should not do

- do not invent major UX flows without reference to the information architecture doc
- do not add non-permissive dependencies
- do not convert structured state into raw HTML blobs as the canonical source of truth
- do not bypass matter-scoped authz rules for convenience
- do not treat chat-only state as the long-term product model
- do not mark work done without verification

---

## Preferred task types for Codex

Codex is best used on slices like:
- add DB table and repository
- implement service module and route wiring
- write tests for a storage or API flow
- implement document save/load round-trip
- add authz guardrails for matter/document access
- wire persistence for collaboration snapshots

---

## Verification standard

If you touch:

### Backend logic
Run:
- relevant unit/integration tests
- route or service smoke checks

### Shared contracts
Run:
- type/build checks if available
- tests that hit the changed contracts

### Renderer code
At minimum run:
- build/lint checks
- smoke verification if possible
- if design-sensitive, expect Claude review later

---

## Status update template for Codex

At the end of each run, add a concise update to the live build loop doc including:
- task id(s) worked
- files changed
- verification performed
- result: done / partial / blocked
- next recommended task

---

## When Codex should stop

Stop and escalate when:
- the next task requires a meaningful product or UX decision
- the docs conflict
- a dependency may violate licensing rules
- verification fails in a way that suggests architectural ambiguity
- the change would require a major redesign outside the bounded slice

---

## Ideal handshake with Claude Code

The default handoff should be:
1. Claude Code defines or refines the slice.
2. The implementation agent executes the slice.
3. Claude Code reviews for product and spec compliance.
4. Codex performs an explicit review pass after Claude's part or after Claude's review conclusions.
5. The implementation agent applies targeted fixes.
6. live loop doc is updated.

When Claude Code is the implementation agent for a frontend-heavy slice, Codex should still review the work before the slice is considered complete.

---

## Success condition for a Codex run

A successful Codex run does not just change code.
It:
- advances one bounded task
- verifies the change
- leaves the repo better documented
- makes the next run easier

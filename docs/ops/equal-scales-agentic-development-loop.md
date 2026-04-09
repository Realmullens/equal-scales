# Equal Scales Agentic Development Loop

> For Bailey, Codex, Claude Code, and future coding agents: this document defines the recommended development strategy for building Equal Scales with a low-touch, continuously improving agent loop.

## Goal

Create a development system where the human does not need to manually re-specify every next step.
Instead, the project should advance through a controlled loop:
- read the canonical docs
- choose the next roadmap task
- implement a bounded slice
- run verification
- update the living status document
- either continue automatically or stop only when blocked by a real product decision

This is the closest practical version of a "Ralph's Loop" style workflow for Equal Scales.

---

## 1. What this loop is trying to optimize for

We want:
- less repeated steering from Bailey
- faster iteration without chaos
- a persistent roadmap that agents can keep advancing
- clear outcome tests
- a system where Codex and Claude Code each do the work they are best at
- human review only at meaningful gates

We do not want:
- a fully autonomous free-for-all
- endless refactors without product progress
- agent sessions that forget what "done" means
- giant multi-day runs without verification checkpoints

---

## 2. Research-informed principles behind this loop

This loop is based on a few strong patterns from software engineering and agent-tooling guidance:

### A. Explore first, then plan, then code
Claude Code's own best-practices docs explicitly push:
- explore first
- then plan
- then code
- give the model a way to verify its work
- use subagents and parallel sessions for investigation
- manage context aggressively

Implication for Equal Scales:
- every autonomous run should start from a current plan/status doc, not from vague intent

### B. Specification by example beats vague requirements
Martin Fowler's "Specification by Example" framing is a strong fit here.
Instead of abstract goals only, the loop should include:
- concrete examples
- acceptance cases
- visible expected behavior

Implication for Equal Scales:
- every roadmap item should include outcome tests and example workflows

### C. Verification must be layered
The practical test pyramid approach says not to rely only on slow end-to-end tests.
We need layered verification:
- unit tests
- integration tests
- acceptance tests for workflows
- lightweight end-to-end smoke checks where needed

Implication for Equal Scales:
- the loop should not continue based only on "the code compiled"

### D. Living documentation is part of the system
The loop only works if docs are updated as state changes.
Otherwise every new session has to reconstruct the world.

Implication for Equal Scales:
- one living execution/status file must be updated every loop

---

## 3. Recommended operating model

Use a three-layer development control system.

### Layer 1: Canonical product docs
These define what the product is.
They change slowly.

Use:
- `docs/vision/equal-scales-master-product-vision.md`
- `docs/roadmap/equal-scales-product-roadmap.md`
- `docs/architecture/equal-scales-domain-model.md`
- `docs/architecture/equal-scales-information-architecture.md`
- `docs/plans/...` implementation docs

### Layer 2: Living loop document
This is the heartbeat of the autonomous build.
It changes every session.

This doc should answer:
- what the current objective is
- what the next task is
- what the acceptance checks are
- what has been completed
- what is blocked
- what should be done next automatically

### Layer 3: Agent runbooks / execution prompts
These are per-agent instructions.
They should be lightweight and derived from the living loop doc.

---

## 4. My recommended division of labor: Codex + Claude Code

## Codex / GPT-5.4 should primarily own
- backend implementation
- repository and storage work
- API contracts
- migration work
- test writing
- refactors with strong verification
- repeated small task execution from a precise checklist
- keeping the living status doc updated after each task

Why:
- high throughput on bounded implementation tasks
- strong when given clear specs and verification steps
- good fit for iterative backlog chewing

## Claude Code / Opus 4.6 should primarily own
- frontend architecture and UI composition
- higher-context refactors in the renderer
- design-sensitive workspace implementation
- exploratory codebase investigation
- multi-file UI and interaction flows
- planning and plan-mode review before larger changes

Why:
- strong at richer product-shape reasoning
- good at frontend organization and exploratory implementation
- strong with subagents, plan mode, worktrees, and codebase interpretation

## Shared rule
Neither tool should be allowed to freestyle the roadmap.
Both must work from the same living loop document and acceptance tests.

---

## 5. The actual loop

Here is the loop I recommend.

### Step 0: Read the canonical docs
Every run starts by reading:
- `AGENTS.md`
- `docs/README.md`
- the living loop doc
- any referenced plan for the current phase

### Step 1: Pick one bounded objective
Not "build the whole editor."
Instead:
- create document CRUD routes
- add Yjs provider wiring
- build the document workspace shell
- add comments table migration

### Step 2: Restate acceptance criteria
The agent must rewrite the task into:
- concrete outcomes
- specific files
- specific tests
- explicit non-goals

### Step 3: Implement only that slice
- keep the change bounded
- avoid unrelated cleanup
- prefer one coherent vertical slice

### Step 4: Run verification
Verification should include whichever apply:
- unit tests
- integration tests
- lints/types/build
- app smoke checks
- screenshot/UI review where relevant

### Step 5: Update the living loop document
The agent must update:
- completed tasks
- changed files
- new blockers
- next recommended task
- confidence / verification notes

### Step 6: Decide continue vs stop
Continue automatically only if:
- the next task is already defined
- the next task is low ambiguity
- all current checks passed
- no real product decision is needed

Stop and escalate only if:
- a design decision affects the product meaningfully
- tests reveal architecture uncertainty
- dependency/licensing concerns arise
- multiple roadmap paths are plausible

---

## 6. The living loop document structure

Create one main doc that is updated continuously.

Recommended file:
- `docs/ops/equal-scales-live-build-loop.md`

Recommended sections:

### Header
- current phase
- current objective
- current owning agent
- last updated timestamp

### Canonical inputs
- which vision/roadmap/plan docs govern this run

### Current milestone
- one paragraph describing the present target

### Task queue
For each task:
- id
- title
- status: pending / in_progress / blocked / done
- owner: codex / claude-code / human
- dependencies
- files likely touched
- acceptance tests

### Verification log
- commands run
- outcomes
- failures
- follow-ups

### Decisions made
- important architectural choices made during implementation

### Blockers / questions for Bailey
- only true product decisions or hard blockers

### Next automatic task
- the exact next task the agent should execute if no blocker exists

This is the doc that makes the loop persist across sessions.

---

## 7. The right kind of tests for this loop

You asked for "best outcomes tests exactly how we want to operate."
That is the right instinct.

I would use four layers.

## Layer 1: Outcome tests
These are product-facing acceptance checks.
Examples:
- user can open a matter and create a draft from a template
- user can open a document workspace and save a structured draft
- two sessions can collaborate on the same draft
- assistant can navigate to review mode from chat

These should be written in plain language and kept in docs.

## Layer 2: Integration tests
Examples:
- document CRUD round-trip works
- Yjs snapshot persistence works
- matter-scoped authz rejects wrong-matter document access

## Layer 3: Unit tests
Examples:
- document schema normalization
- template variable resolution
- document command generation

## Layer 4: UI smoke checks
Examples:
- workspace mounts
- primary panes render
- no fatal frontend runtime errors
- screenshot/manual QA checklist for important flows

The loop should only advance when the right tests for that layer pass.

---

## 8. How to combine Codex and Claude Code effectively

## Pattern A: Claude plans, Codex executes, Claude reviews
Use when:
- feature is medium/large
- frontend or interaction shape matters
- architecture could drift

Flow:
1. Claude Code reads docs and creates/revises the plan for the next slice.
2. Codex implements the slice.
3. Claude Code reviews for spec compliance and UI/product quality.
4. Codex fixes review findings.
5. living loop doc is updated.

This is my favorite default for Equal Scales.

## Pattern B: Codex executes backend track while Claude executes frontend track
Use when:
- tasks are truly separable
- one slice is backend-heavy and one is frontend-heavy
- they can work from the same acceptance contract

Example:
- Codex: document storage + routes + DB migration
- Claude: document workspace shell + React components

Then merge behind a shared verification task.

## Pattern C: Claude investigates, Codex productionizes
Use when:
- the problem is messy or ambiguous
- you want stronger upfront codebase interpretation

Example:
- Claude explores best renderer integration path
- Codex implements the chosen pattern with tests

---

## 9. What should trigger human attention

You said you don't want to keep sitting there iterating.
That is realistic, but some human gates are still worth keeping.

Bailey should only need to intervene on:
- product-direction forks
- legal UX choices with significant downstream impact
- dependency/license exceptions
- ambiguous behavior where the docs are not decisive
- final review of major milestones

Everything else should stay inside the loop.

---

## 10. Recommended milestone cadence

Do not let the loop run forever without a milestone boundary.
Use milestone packages.

Recommended cadence:
- milestone = 3 to 10 tightly related tasks
- after each milestone, produce:
  - summary
  - verification results
  - updated living loop doc
  - next milestone proposal

That gives you autonomy without chaos.

---

## 11. What I would build next to make this real

If we want to operationalize this immediately, I would create these files next:

1. `docs/ops/equal-scales-live-build-loop.md`
   - the living execution/status file

2. `docs/ops/equal-scales-outcome-tests.md`
   - human-readable acceptance scenarios for the major workflows

3. `docs/ops/equal-scales-agent-runbook-codex.md`
   - how Codex should read tasks, implement, verify, and update docs

4. `docs/ops/equal-scales-agent-runbook-claude-code.md`
   - how Claude Code should plan, investigate, review, and handle UI work

5. optional: `docs/ops/equal-scales-milestones.md`
   - a milestone board tying roadmap phases to execution slices

---

## 12. My recommended strategy for you specifically

If I were running this with your subscriptions, I would do this:

### Primary workflow
- use Claude Code as planner/reviewer/frontend lead
- use Codex as executor/backend lead
- keep one living loop doc in the repo
- keep one outcome-tests doc in the repo
- require every loop to update those docs before ending

### Practical flow
1. We define milestone and acceptance tests.
2. Claude Code creates or updates the implementation slice plan.
3. Codex executes the next bounded task list.
4. Claude Code reviews the changes against the docs and product shape.
5. Codex applies fixes.
6. The loop doc is updated with status and next task.
7. The next run starts from that doc automatically.

### Why this is the best fit
Because it balances:
- autonomy
- planning quality
- frontend sensitivity
- execution speed
- durable project memory

---

## 13. My bottom-line recommendation

Yes — we absolutely should build a living "Ralph's Loop" style document system for Equal Scales.

But it should not be a vague endless prompt.
It should be a controlled, spec-driven loop with:
- canonical docs
- a living build-loop file
- explicit outcome tests
- bounded milestones
- Codex/Claude role separation
- mandatory verification and doc updates every cycle

That is how you reduce repeated manual steering without letting the project drift into nonsense.

---

## 14. Immediate next move

The best next move is not more abstract discussion.
The best next move is to create the operational files for the loop and make them the new execution layer for the repo.

Specifically:
- `docs/ops/equal-scales-live-build-loop.md`
- `docs/ops/equal-scales-outcome-tests.md`
- `docs/ops/equal-scales-agent-runbook-codex.md`
- `docs/ops/equal-scales-agent-runbook-claude-code.md`

Once those exist, the loop can actually run.

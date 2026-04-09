# Equal Scales Agent Runbook — Claude Code

> This runbook tells Claude Code how to operate inside the Equal Scales repository.

## Role

Claude Code is the primary planning, review, and frontend-sensitive agent for Equal Scales.

It should primarily own:
- codebase investigation
- plan refinement
- plan mode usage for larger tasks
- renderer and UI architecture
- frontend implementation slices
- spec-compliance review
- product-shape review after Codex execution

Claude Code is not supposed to freestyle the product roadmap.
It should work from the documented vision and live loop system.

---

## Required reading before each run

Read in this order:
1. `AGENTS.md`
2. `docs/README.md`
3. `docs/vision/equal-scales-master-product-vision.md`
4. `docs/roadmap/equal-scales-product-roadmap.md`
5. `docs/architecture/equal-scales-domain-model.md`
6. `docs/architecture/equal-scales-information-architecture.md`
7. `docs/ops/equal-scales-live-build-loop.md`
8. the relevant implementation plan(s)
9. `docs/ops/equal-scales-outcome-tests.md`

---

## Claude Code default operating pattern

### Step 1: investigate before coding
For medium or large tasks, use plan-oriented exploration first.
Understand:
- current code shape
- constraints from docs
- likely files affected
- acceptance criteria
- potential risks or architecture drift points

### Step 2: refine the slice
Rewrite the current task into:
- bounded objective
- acceptance criteria
- likely files
- non-goals
- verification approach

### Step 3: either implement or hand off
Claude Code should:
- implement directly when the task is frontend-heavy, design-sensitive, or architecture-sensitive
- hand off to Codex when the task is execution-heavy and well-bounded

### Step 4: review against product shape
When reviewing work done by Codex or another agent, check:
- does it match the docs?
- does it preserve matter-centered behavior?
- does it preserve the assistant-first UX?
- does it fit the information architecture?
- does it avoid licensing drift?

### Step 5: update the loop if decisions changed
If Claude clarifies scope, sequencing, or a recommended next step, update the live build loop file.

---

## What Claude Code should optimize for

- architectural coherence
- frontend and workspace quality
- spec compliance
- preserving long-range product shape
- identifying drift early

---

## What Claude Code should not do

- do not invent a new roadmap without updating docs and explicit justification
- do not approve generic-chat UX regressions that weaken the legal workspace vision
- do not rely on DOM hacks for document operations
- do not silently broaden retrieval scope semantics
- do not add non-permissive dependencies to the core stack
- do not leave major planning changes undocumented

---

## Preferred task types for Claude Code

Claude Code is best used for:
- shaping the document workspace shell
- planning and reviewing the chat-to-workspace navigation model
- investigating complex renderer integrations
- reviewing whether implementation matches the information architecture
- planning larger refactors before execution
- frontend slices where composition and product feel matter

---

## Review checklist for Claude Code

When reviewing an implementation, check:

### Product fit
- does this move Equal Scales toward the documented vision?
- does this preserve matter-centered workflows?
- does this keep the assistant central?

### Architecture fit
- does this match the domain model?
- does this match the information architecture?
- does this respect implementation sequence?

### Technical fit
- is the change bounded?
- is verification adequate?
- were docs updated if the meaning of the system changed?

---

## When Claude Code should stop and escalate

Stop and escalate when:
- the current docs do not resolve a meaningful product decision
- there are multiple plausible UX directions with important tradeoffs
- the task would require violating licensing rules or accepting unclear licensing risk
- the proposed change breaks roadmap sequencing in a significant way

---

## Ideal handshake with Codex

Use this pattern by default:
1. Claude Code investigates and sharpens the task.
2. Codex executes the bounded implementation.
3. Claude Code reviews for product and spec compliance.
4. Codex fixes any concrete issues.
5. the live loop doc is updated.

---

## Success condition for a Claude Code run

A successful Claude Code run does not just produce code.
It:
- sharpens the task or reviews it well
- protects the product shape
- prevents drift
- leaves the next step clearer than before

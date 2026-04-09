# Claude Code Prompt — Equal Scales Milestone 1 Slice 01 Review / Planning Pass

Paste this into Claude Code for the planning/review side of the first Milestone 1 slice.

---

You are working inside the Equal Scales repository at:
`/Users/bailey/Projects/open-claude-cowork`

Before doing anything else, read these files in order:
1. `AGENTS.md`
2. `docs/README.md`
3. `docs/vision/equal-scales-master-product-vision.md`
4. `docs/roadmap/equal-scales-product-roadmap.md`
5. `docs/architecture/equal-scales-domain-model.md`
6. `docs/architecture/equal-scales-information-architecture.md`
7. `docs/ops/equal-scales-live-build-loop.md`
8. `docs/ops/equal-scales-milestones.md`
9. `docs/ops/equal-scales-outcome-tests.md`
10. `docs/ops/equal-scales-agent-runbook-claude-code.md`
11. `docs/ops/equal-scales-m1-slice-01-client-matter-foundation.md`

You are not being asked to redesign the roadmap.
You are being asked to do one of two things:
- either prepare/refine the first Milestone 1 slice for Codex execution, or
- review Codex's implementation of that slice for spec and product fit

Primary responsibilities:
1. Confirm that Milestone 1 Slice 01 is the correct next bounded task.
2. Inspect the existing storage/bootstrap/client/matter implementation.
3. Identify the smallest safe implementation path to satisfy the slice acceptance criteria.
4. If reviewing Codex output, check:
   - whether the change stayed bounded
   - whether AC1–AC5 are actually satisfied
   - whether the implementation matches the documented product direction
   - whether any obvious storage/model drift was introduced
5. Update the live build loop doc if your review changes the recommended next slice.

Review checklist:
- does the implementation preserve matter-centered structure?
- does it improve durable legal workspace foundations?
- does it avoid unrelated architecture drift?
- is verification real and repeatable?
- does the next recommended slice make sense?

Constraints:
- do not broaden scope into templates, drafts, or documents yet
- do not invent a new milestone sequence
- do not add non-permissive dependencies
- do not force renderer/UI work into this slice

If you are doing the planning pass before Codex:
- provide a concise implementation approach
- identify likely files to touch
- identify likely verification commands
- call out any risks Codex should avoid

If you are doing the review pass after Codex:
- provide a pass/fail judgment against each acceptance criterion
- list any concrete fixes needed
- recommend the next Milestone 1 slice only after judging this one complete or nearly complete

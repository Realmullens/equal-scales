# Codex Prompt — Equal Scales Milestone 1 Slice 01

Paste this into Codex after confirming it can read the repo files directly.

---

You are working inside the Equal Scales repository at:
`/Users/bailey/Projects/open-claude-cowork`

Before doing anything else, read these files in order:
1. `AGENTS.md`
2. `docs/README.md`
3. `docs/ops/equal-scales-live-build-loop.md`
4. `docs/ops/equal-scales-milestones.md`
5. `docs/ops/equal-scales-outcome-tests.md`
6. `docs/ops/equal-scales-agent-runbook-codex.md`
7. `docs/ops/equal-scales-m1-slice-01-client-matter-foundation.md`

Your task is to execute Milestone 1 Slice 01: Client and Matter Foundation Hardening.

Important context:
- the repo already contains SQLite bootstrap code, vault path logic, repositories, and client/matter routes
- do not redesign the whole system
- this is a bounded hardening and verification slice
- do not add non-permissive dependencies
- do not start renderer/UI work
- do not move into templates, drafts, or documents yet

Your required workflow:
1. Inspect the existing implementation for storage bootstrap, client routes, and matter routes.
2. Restate the slice in your own words before coding:
   - objective
   - files likely to change
   - tests/verification you will run
   - non-goals
3. Implement only the minimum needed to satisfy the slice acceptance criteria.
4. Add a repeatable verification mechanism for the storage foundation.
5. Run verification.
6. Update `docs/ops/equal-scales-live-build-loop.md` with:
   - what you changed
   - what you verified
   - whether the slice passed
   - the next recommended Milestone 1 slice

Acceptance criteria to satisfy:
- AC1: server startup initializes storage safely and idempotently
- AC2: client creation works durably
- AC3: matter creation under a client works durably
- AC4: invalid input is rejected cleanly
- AC5: repeatable verification exists and can be rerun

Files likely involved:
- `server/server.js`
- `server/storage/db.js`
- `server/storage/paths.js`
- `server/storage/schema.sql`
- `server/storage/repositories/clients.js`
- `server/storage/repositories/matters.js`
- `server/routes/clients.js`
- `server/routes/matters.js`
- new verification script or test file(s)

Constraints:
- keep the slice bounded
- preserve current backend startup behavior
- avoid unrelated cleanup
- prefer verification and hardening over speculative improvements

Expected completion output:
- concise summary of files changed
- verification commands run
- pass/fail against each acceptance criterion
- exact next recommended slice

Do not move on to another milestone or another feature after this slice.
Stop after updating the live build loop doc.

# Equal Scales Milestone 1 Slice 01 — Client and Matter Foundation Hardening

> For Codex and Claude Code: this is the first bounded execution slice after the agentic loop setup. It should be treated as the next implementation target unless Bailey explicitly changes direction.

## Goal

Harden and verify the existing local legal workspace storage foundation so that client and matter objects are durably created, retrievable, and associated with stable vault paths.

This slice exists because the repository already contains partial Milestone 1 groundwork:
- SQLite bootstrap exists
- vault path resolution exists
- client repository exists
- matter repository exists
- client/matter routes exist
- server initialization already wires storage startup

The next smart move is not to invent new architecture.
It is to validate and harden what is already there.

---

## Why this should be first

This is the best first bounded slice because:
- it builds on work already present in the repo
- it reduces ambiguity before later template/draft/document work
- it creates a strong base for Milestone 1 outcome tests
- it gives both Codex and Claude Code a concrete, low-risk starting point

---

## Target outcomes for this slice

This slice should satisfy or partially satisfy:
- `OUTCOME-A1 — Create a client`
- `OUTCOME-A2 — Create a matter under a client`

It should also prepare the path toward:
- `OUTCOME-A3 — Matter becomes the active scope`

---

## In scope

1. Verify current SQLite bootstrap and vault path behavior.
2. Verify client CRUD API behavior already present.
3. Verify matter CRUD API behavior already present.
4. Harden any obvious correctness gaps in:
   - ID/slug creation
   - route validation
   - vault path persistence
   - startup initialization
5. Add repeatable verification for the storage foundation.
6. Update the live loop doc after the slice is complete.

---

## Out of scope

- renderer/UI work
- chat navigation changes
- template library work
- draft generation work
- document editor work
- collaboration work
- broad schema redesign unless absolutely necessary for this slice

---

## Files most likely involved

Inspect and likely touch:
- `server/server.js`
- `server/storage/db.js`
- `server/storage/paths.js`
- `server/storage/schema.sql`
- `server/storage/repositories/clients.js`
- `server/storage/repositories/matters.js`
- `server/routes/clients.js`
- `server/routes/matters.js`
- new verification script or test file(s)

Possible good locations for new verification code:
- `server/tests/storage/client-matter-foundation.test.js`
- or `server/scripts/verify-client-matter-foundation.js`

Pick the simplest fit for the current repo.

---

## Acceptance criteria

The slice is done when all of the following are true:

### AC1 — server startup initializes storage safely
- starting the backend initializes the Equal Scales storage foundation without crashing
- repeated startup remains idempotent

### AC2 — client creation works durably
- `POST /api/clients` creates a client row
- created client can be retrieved later
- client slug is stable and unique enough for current use
- client root vault path is stored if vault creation succeeds

### AC3 — matter creation under a client works durably
- `POST /api/matters` creates a matter row under an existing client
- created matter can be listed by client and fetched directly
- matter vault path is stored if vault creation succeeds

### AC4 — invalid input is rejected cleanly
- missing client name returns a 400 for client creation
- missing clientId or matter name returns a 400 for matter creation
- nonexistent clientId for matter creation returns a 404

### AC5 — verification exists and can be rerun
- there is a repeatable test or verification script covering the above behavior
- the command to run it is documented in the live loop update

---

## Suggested verification

At minimum, run one of these:
- automated test hitting repository/API behavior
- scripted API smoke check against a running backend

Recommended checks:
1. start backend
2. create client
3. fetch/list client
4. create matter under that client
5. fetch/list matter
6. verify stored root path / matter path values exist when expected
7. rerun startup or rerun script to confirm no initialization breakage

---

## Implementation notes

- prefer small hardening changes over speculative redesign
- if existing code already satisfies part of the acceptance criteria, preserve it and prove it
- if you discover a structural issue, fix only the minimum needed for this slice
- leave the repo better verified and better documented than before

---

## Deliverables

1. hardened storage/API code if needed
2. repeatable verification script or test(s)
3. concise update to `docs/ops/equal-scales-live-build-loop.md`
4. milestone status update if appropriate

---

## Completion handoff format

At the end of the run, report:
- what files changed
- what behavior was hardened
- what verification was run
- whether AC1–AC5 passed
- what the next recommended Milestone 1 slice should be

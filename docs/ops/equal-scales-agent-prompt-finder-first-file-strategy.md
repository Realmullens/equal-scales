# Agent Prompt — Shift Equal Scales to a Finder-First File Strategy

Paste the following into your coding agent.

---

You are working inside the Equal Scales repository at:
`/Users/bailey/Projects/open-claude-cowork`

Your assignment is to shift the current file-browsing experience to a Finder-first native OS file strategy instead of continuing to invest in the custom in-app file browser as the primary file exploration surface.

## Read first

Before making changes, read these files in order:
1. `AGENTS.md`
2. `docs/README.md`
3. `docs/vision/equal-scales-master-product-vision.md`
4. `docs/architecture/equal-scales-domain-model.md`
5. `docs/architecture/equal-scales-information-architecture.md`
6. `docs/ops/equal-scales-live-build-loop.md`
7. `README.md`

Then inspect these implementation files carefully:
- `main.js`
- `preload.js`
- `renderer/renderer.js`
- `renderer/index.html`
- `renderer/style.css`
- `server/storage/paths.js`
- `server/storage/repositories/clients.js`
- `server/storage/repositories/matters.js`
- `server/routes/files.js`

## Product direction for this task

Equal Scales should use the native operating system file viewer (Finder on macOS) as the main short-term and medium-term file exploration experience.

That means:
- do not continue building the custom embedded file browser as the main file manager UX
- instead, make it easy for the user and the assistant to open the correct vault location in Finder
- preserve matter-centered and client-centered context when doing so

The goal is not to remove file awareness from the app.
The goal is to stop treating the in-app custom browser as the primary browsing surface.

## Primary objective

Implement a Finder-first file strategy where the app can reveal the right location on disk for:
- the vault root
- the active client folder
- the active matter folder
- the active matter drafts folder
- the active matter source-documents folder
- a specific file when relevant

## Existing context already in the repo

There is already some support for opening paths in Finder via:
- `main.js` IPC handler: `open-in-finder`
- `preload.js` exposure: `openInFinder(...)`

There is also an existing custom in-app file browser in `renderer/renderer.js`.
That browser currently handles:
- browsing directories
- rendering entries
- create folder
- delete file
- context menus
- breadcrumb/history state

You are not required to delete all of that code immediately unless doing so is safe and clearly beneficial.
You are required to de-emphasize or bypass it as the primary file exploration experience and replace the main UX path with Finder-first actions.

## Desired UX outcome

The app should provide simple, matter-aware actions such as:
- Open Vault in Finder
- Open Client Folder in Finder
- Open Matter Folder in Finder
- Open Drafts Folder in Finder
- Open Source Documents Folder in Finder
- Reveal This File in Finder

These actions should be available where they make sense in the current UI.

The assistant should also be able to trigger these actions in the future through structured app actions.

## In scope

- inspect the current file-browser-related UI and logic
- identify the cleanest way to make Finder-first actions primary
- add or improve helper functions for opening the right paths in Finder
- wire client/matter-aware Finder actions into the renderer
- preserve path safety and vault-root restrictions
- keep the current app stable
- optionally leave the old custom browser code in place if removing it would create unnecessary risk

## Out of scope

- redesigning the whole workspace shell
- building a new embedded file manager
- adding React just for file browsing
- changing the long-term document viewer/editor plan
- weakening filesystem safety checks

## Constraints

- keep Equal Scales matter-centered
- do not introduce non-permissive dependencies
- do not break current client/matter storage behavior
- preserve vault path safety
- prefer the narrowest clean implementation that improves product direction now

## Suggested implementation direction

1. Inspect how current client and matter records store root paths / matter paths.
2. Inspect how drafts and source-documents paths are derived.
3. Add or refine renderer-side actions for opening:
   - vault root
   - client root path
   - matter path
   - matter drafts path
   - matter source-documents path
4. Replace or de-emphasize the current embedded file browser entry points in the UI with Finder-first buttons/actions.
5. Keep the old custom browser code only if needed to avoid risky breakage, but do not keep presenting it as the primary browsing model.
6. Ensure path handling stays inside the Equal Scales vault and cannot escape it.

## Acceptance criteria

### AC1
A user can open the Equal Scales vault root in Finder from the app.

### AC2
A user can open the active client folder in Finder when a client is selected.

### AC3
A user can open the active matter folder in Finder when a matter is selected.

### AC4
A user can open the active matter drafts folder and source-documents folder in Finder when those paths exist.

### AC5
If a specific file is represented in the UI, the app can reveal that file in Finder.

### AC6
All Finder-open actions remain vault-scoped and do not introduce path traversal issues.

### AC7
The app no longer depends on the custom in-app browser as the primary browsing experience.

## Verification

At minimum verify:
- app boots successfully
- Finder actions appear in the intended UI locations
- opening vault/client/matter/drafts/source-documents works
- no obvious path safety regression exists
- current client/matter workflows still function

## Deliverables

When finished, report back with:
1. files changed
2. what UI actions were added or changed
3. what parts of the old custom browser were removed, bypassed, or left in place
4. how vault safety is preserved
5. verification performed
6. any recommended follow-up cleanup work

## Documentation update requirement

If this changes the intended file strategy in a meaningful way, update the relevant docs before ending, especially:
- `docs/ops/equal-scales-live-build-loop.md`
- and any architecture or implementation notes that should mention the Finder-first approach

## Final instruction

Do not stop at a plan.
Inspect the repo, implement the Finder-first file strategy, verify it, and summarize the results.

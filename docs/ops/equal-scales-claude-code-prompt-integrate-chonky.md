# Claude Code Prompt — Integrate Chonky to Replace the Custom File Browser

Paste the following into Claude Code.

---

You are working inside the Equal Scales repository at:
`/Users/bailey/Projects/open-claude-cowork`

Your assignment is to replace the current custom-built renderer-side file browser with Chonky, the MIT-licensed React file browser component, while preserving Equal Scales product constraints and existing backend file APIs.

Reference resources for Chonky:
- Repo: https://github.com/TimboKZ/Chonky
- Docs/Homepage: https://chonky.io

## Required reading before coding

Read these files first, in order:
1. `AGENTS.md`
2. `docs/README.md`
3. `docs/vision/equal-scales-master-product-vision.md`
4. `docs/architecture/equal-scales-domain-model.md`
5. `docs/architecture/equal-scales-information-architecture.md`
6. `docs/ops/equal-scales-live-build-loop.md`
7. `docs/ops/equal-scales-agent-runbook-claude-code.md`
8. `README.md`

Then inspect these implementation files carefully:
- `renderer/renderer.js`
- `renderer/index.html`
- `renderer/style.css`
- `preload.js`
- `main.js`
- `server/routes/files.js`
- `server/server.js`

## Important repo context already observed

There is already a custom file browser implementation in `renderer/renderer.js`, including logic around:
- `browseToPath(...)`
- `renderFileBrowser(...)`
- file browser history and breadcrumb state
- context menus
- create folder
- delete file
- opening files from the vault
- `window.electronAPI.browseFiles(...)`
- `window.electronAPI.createFolder(...)`
- `window.electronAPI.deleteFile(...)`
- `window.electronAPI.openInFinder(...)`

Backend file APIs already exist and are wired through:
- `preload.js`
- `server/routes/files.js`
- `server/server.js`

Your job is not to rebuild file browsing from scratch.
Your job is to replace the current custom renderer-side browsing UI with Chonky in a way that fits Equal Scales.

## Product and architecture constraints

You must preserve these rules:
- Equal Scales is matter-centered and assistant-led
- do not introduce non-permissive dependencies
- do not break existing backend file APIs unless there is a strong reason
- do not weaken vault path safety or filesystem restrictions
- do not turn this into a generic cloud file manager product
- keep the implementation scoped to replacing the file browser UI layer, not redesigning the whole app

## Primary objective

Integrate Chonky as the renderer-side file browser UI and replace the current custom file browser rendering logic with a Chonky-based implementation.

## Secondary objective

Keep the existing Equal Scales-specific behavior where possible, including:
- browsing within the vault
- directory navigation
- opening files
- creating folders
- deleting files
- opening items in Finder
- preserving matter/client workspace context

## What success looks like

A successful implementation should:
1. add Chonky to the project with the correct MIT-licensed package(s)
2. render the file browser through Chonky rather than the current custom DOM-built file list
3. map existing backend file data into Chonky's file/folder model cleanly
4. preserve working file actions using the existing Electron/backend APIs when possible
5. keep the UI integrated with Equal Scales rather than feeling like an unrelated embedded demo
6. avoid breaking the rest of the renderer

## In scope

- installing Chonky and required compatible dependencies
- building a Chonky wrapper component or integration layer
- replacing custom file-browser rendering logic in the renderer
- adapting current browse/history/path state into a Chonky-driven interaction model
- preserving or re-implementing current file actions using Chonky action handlers
- minimal styling adjustments to fit the current app

## Out of scope

- replacing the backend file API architecture entirely
- redesigning the whole workspace shell
- implementing a brand new document viewer
- changing licensing policy
- adding broad file sync/cloud features

## Expected implementation approach

1. Explore current file-browser-related code and identify the exact custom UI pieces to replace.
2. Inspect Chonky's current package structure and determine the minimum required install.
3. Design the narrowest integration path:
   - likely a small wrapper module/component around Chonky
   - adapt backend file entries to Chonky format
   - route Chonky actions back into existing APIs
4. Replace the current custom file-browser rendering path in a controlled way.
5. Keep or adapt these capabilities:
   - folder navigation
   - back/up behavior if appropriate
   - file open
   - create folder
   - delete file
   - open in Finder
6. Run verification and report any remaining gaps.

## Verification requirements

At minimum verify:
- app still boots
- file browser surface renders without crashing
- browsing folders works
- opening a file still works
- create folder still works
- delete file still works
- open in Finder still works
- no obvious vault path regression is introduced

If you can, also verify:
- breadcrumbs or equivalent path awareness still works
- interaction feels cleaner than the custom implementation

## Deliverables

When done, report back with:
1. what packages were added
2. what files were changed
3. what old custom file-browser logic was removed or bypassed
4. how backend file entries are mapped into Chonky
5. what verification was run
6. any remaining issues or follow-up tasks

## Documentation update requirement

If the integration meaningfully changes how file browsing works in the app, update the relevant docs before ending, especially:
- `docs/ops/equal-scales-live-build-loop.md`
- and any implementation notes that should help the next agent

## Final instruction

Do not just describe a plan.
Inspect the codebase, determine the cleanest narrow integration path, implement it, verify it, and summarize the result.

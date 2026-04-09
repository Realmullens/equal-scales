# Claude Code Kickoff Prompt — Equal Scales Phase 1

Paste the following into Claude Code after giving it the full master implementation spec.

---

You are working inside the Equal Scales codebase at:
`/Users/bailey/Projects/open-claude-cowork`

Before making changes, read this document fully and treat it as the canonical implementation source of truth:
`/Users/bailey/Projects/open-claude-cowork/docs/plans/2026-04-08-equal-scales-template-first-implementation-spec.md`

Important context:
- This codebase began as Open Claude Cowork.
- It has already been partially rebranded to Equal Scales.
- Dark mode/theme toggle work already exists and must not regress.
- The backend has already been patched to run without COMPOSIO_API_KEY.
- The app still behaves mostly like a chat-first app with localStorage-backed sessions.
- Equal Scales is intentionally moving to a template-first legal drafting workflow before building a full document viewer/editor.
- Chat is the primary control surface of the app and must remain central to the product direction.

Your tasks for this kickoff:

1. Read the master spec completely.
2. Inspect the current codebase and confirm your understanding of:
   - current renderer architecture
   - current backend/server architecture
   - existing branding and dark mode changes
   - current persistence model
3. Summarize the implementation plan back to me in your own words.
4. Explicitly identify the work that belongs in Phase 1 only.
5. Do NOT implement all phases.
6. After summarizing, implement only Phase 1: local vault + SQLite foundations.

Phase 1 goals:
- create a local Equal Scales vault path strategy
- create and initialize a local SQLite database
- add first schema for clients, matters, templates, drafts, conversations, messages
- add backend repository modules for these entities
- make initialization idempotent and safe
- do not migrate the whole renderer off localStorage yet
- do not build the full UI for clients/matters/templates yet
- do not break the current chat loop

Constraints:
- local-first only
- no cloud storage dependency
- no unrestricted cross-client retrieval logic
- no large renderer rewrite in this phase
- keep current app boot and chat behavior working
- preserve current theme/dark mode behavior

Implementation guidance:
- prefer explicit modules over overengineered abstractions
- use stable local paths for macOS
- keep filesystem and database responsibilities separate
- add code comments where useful for future phases
- avoid changing unrelated files unless necessary

Expected deliverables:
- storage path module
- DB bootstrap module
- schema/migration file(s)
- repository layer for clients/matters/templates/drafts/conversations/messages
- backend initialization wiring
- brief note describing what was added and what remains for Phase 2

Before coding:
- provide a concise plan of exactly which files you will create or modify for Phase 1
- then execute
- then report back with a clear summary

Do not proceed to Phase 2 unless explicitly instructed.

---

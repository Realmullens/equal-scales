# Equal Scales Template-First Implementation Spec and Coding-Agent Handoff

> For Hermes / coding agents: this is the primary implementation handoff document for the next phase of Equal Scales. It is based on the current local codebase state in `/Users/bailey/Projects/open-claude-cowork` after existing branding and UX changes already made by Bailey and prior local modifications in this session. Use this document as the operative roadmap unless a newer spec supersedes it.

## Purpose of this Document

This document is designed to be handed directly to a coding agent.

It contains:
- a current-state review of the codebase as it exists right now
- a clear explanation of the product direction shift toward a template-first legal drafting workflow
- a phased implementation roadmap
- explicit architecture decisions based on the current repository
- detailed coding-agent prompts for each phase
- constraints, guardrails, and anti-patterns
- sequencing guidance so the coding agent does not waste time building the wrong thing first

This document assumes:
- Equal Scales is being built as a local-first desktop legal co-working app
- the current base is Open Claude Cowork
- the user has already rebranded parts of the app and added dark mode work
- we are intentionally prioritizing template workflows, client workspaces, and drafting flows before a full-featured document viewer/editor

---

# 1. Executive Summary

Equal Scales should move into a template-first legal drafting MVP before investing heavily in a rich embedded document editor.

However, one additional product principle is now explicit and central:
- chat is the primary control surface of the application
- the chat should function like a personal assistant that can navigate, focus, and reconfigure the app UI for the user
- the user should be able to stay in one main conversational view while the surrounding interface morphs to the needed workspace
- the assistant should understand references to clients, matters, templates, drafts, research, review, and documents, and take the user there in the UI

The next useful product loop is:
1. create a client workspace
2. create a matter workspace under a client
3. store reusable legal templates locally
4. let the user select a template for a client or matter
5. let the agent clone that template into a draft
6. let the agent fill structured fields/sections using client and matter context
7. save the generated draft locally
8. let the user preview and iterate
9. let chat drive navigation between those work areas without requiring the user to manually hunt through the interface

This is the right move because:
- it proves the actual legal workflow
- it preserves the chat-centered product experience
- it avoids spending too much time too early on document viewer/editor complexity
- it gives a usable MVP faster
- it fits the architecture already discussed for Equal Scales

The editor/viewer should come later.
The drafting engine, workspace model, and chat-driven navigation model should come first.

---

# 2. Current Codebase Review (As It Exists Right Now)

This section is based on direct inspection of the live local repository.

## 2.1 Repository path
- `/Users/bailey/Projects/open-claude-cowork`

## 2.2 Current git working tree status
Current modified/untracked items observed:
- modified:
  - `README.md`
  - `package-lock.json`
  - `package.json`
  - `renderer/index.html`
  - `renderer/renderer.js`
  - `renderer/style.css`
  - `server/package-lock.json`
  - `server/server.js`
  - `setup.sh`
- untracked:
  - `docs/`
  - `server/EXAMPLE_Will_Filled.docx`
  - `server/hello_world.txt`

## 2.3 What has already been changed locally

### Branding changes already made
The repo has already been partially rebranded from Open Claude Cowork to Equal Scales.
Observed changes include:
- `package.json`
  - `name: "equal-scales"`
  - description now reads: `Equal Scales - AI Coworker Built By Attorneys for Attorneys`
- `renderer/index.html`
  - page title changed to `Equal Scales`
  - landing heading changed to `Equal Scales`
  - tagline changed to `AI Coworker Built By Attorneys for Attorneys`
- `README.md`
  - partially rewritten to describe Equal Scales instead of Open Claude Cowork
- `setup.sh`
  - setup script now prints Equal Scales branding

### Theme / dark mode work already added
Observed in current renderer:
- `renderer/index.html`
  - inline script sets theme from localStorage / prefers-color-scheme
  - new theme toggle button exists in sidebar header
- `renderer/renderer.js`
  - theme logic exists (`setTheme`, `toggleTheme`)
  - theme is persisted in localStorage
- `renderer/style.css`
  - substantial theme token expansion for both light and dark modes
  - expanded sidebar styling and visual refinements

### Current app behavior still remains chat-first
Despite branding updates, the core product shape is still mostly the original general chat app:
- conversations are still stored client-side in `localStorage`
- state uses `allChats` and `currentChatId`
- the left sidebar is still chat history
- there are no first-class client objects
- there are no first-class matter objects
- there is no template library model yet
- there is no vault or SQLite-based workflow model yet

### Current runtime architecture still looks like this
Frontend:
- Electron renderer app
- `renderer/index.html`
- `renderer/renderer.js`
- `renderer/style.css`

Bridge:
- `preload.js`
- exposes:
  - `sendMessage`
  - `stopQuery`
  - `abortCurrentRequest`
  - `getProviders`

Backend:
- `server/server.js`
- provider abstraction with Claude + Opencode
- SSE streaming responses from `/api/chat`
- `/api/abort`
- `/api/providers`
- `/api/health`

Provider implementation:
- `server/providers/claude-provider.js`
- `server/providers/opencode-provider.js`
- `server/providers/base-provider.js`
- `server/providers/index.js`

### Current backend patch already added for degraded mode
The server has already been locally patched so that:
- Composio is only initialized if `COMPOSIO_API_KEY` exists
- the server can run without crashing when Composio is absent

That means the app can already function in a reduced local mode without Composio.
This is useful for Equal Scales because Composio should not be a blocking dependency for the legal drafting MVP.

### Current data persistence limitations
Right now the app still stores important UI/session data in `localStorage`:
- chat sessions
- provider selection
- model selection
- theme

This is acceptable for current shell experimentation, but it is not acceptable for Equal Scales core legal workflows.

### Existing artifacts suggesting document workflow experimentation
The repo now contains:
- `server/EXAMPLE_Will_Filled.docx`
- `server/hello_world.txt`

This suggests initial document-generation or document-output testing has already started conceptually, even if not integrated yet.

## 2.4 Conclusion of current-state review
The codebase is currently:
- good enough to use as the shell
- already partially rebranded
- visually improved with dark mode
- still architecturally chat-first
- not yet transformed into a legal workspace
- not yet structured around clients, matters, templates, or drafts

This means the next plan should not waste time re-solving already completed branding/theming work.
Instead, it should build on what exists and pivot the architecture toward legal workflows.

---

# 3. Product Direction Shift: Template-First Equal Scales

## The important product decision
We are intentionally prioritizing:
- client workspaces
- matter workspaces
- local template library
- agent-driven template cloning/filling
- draft storage/versioning
- preview/review workflow

Before prioritizing:
- a high-fidelity embedded document editor/viewer

## Why this is the correct order
Because the product value is not “we embedded a document editor.”
The product value is:
- the right legal workflow
- the right scoped context
- the right reusable templates
- the right draft generation flow
- local control and inspectability

The best near-term Equal Scales loop is:
- a user selects a client/matter
- chooses a known legal template
- the agent fills the document using the right scoped data
- the resulting draft gets saved locally for review

That already creates real value.

---

# 4. Core MVP Product Goal

Build a local-first legal drafting system where:
- each client has a workspace
- each client can have multiple matters
- templates are first-class local artifacts
- the agent can generate drafts from templates for a specific client/matter
- drafts are saved locally
- drafts are versioned and reviewable
- the system remains transparent and inspectable
- chat acts as the primary orchestration layer for navigating and activating those workflows

This is the first serious Equal Scales MVP.

---

# 4A. Chat-Centered UI Control Model

This section is now part of the canonical implementation spec.

## Product principle
The chat is not just a messaging surface.
The chat is the primary control surface of the application.

The user should be able to remain in a primary conversational view while the rest of the application morphs around the task they are trying to perform.

The assistant should behave like a personal legal coworker and interface operator.

## What this means behaviorally
The assistant should be able to:
- navigate to a client workspace
- navigate to a matter workspace
- open the templates area
- open draft review for a specific draft
- open client-centered information automatically
- open research tools/interfaces
- open file browsing or template browsing
- move the user into the most relevant workspace when the user refers to a client or matter conversationally

Examples:
- “Take me to Acme Corp.”
- “Open the Johnson estate matter.”
- “I think I was working on that probate project.”
- “Show me the demand letter template.”
- “Open the latest will draft for this client.”
- “Take me back to the research for this matter.”

## Ambiguous navigation behavior
The assistant should handle vague or partial references conversationally.

If the user says something ambiguous like:
- “I think I remember this project”
- “Open that client we talked about yesterday”
- “Take me back to that estate planning matter”

Then the assistant should:
1. infer likely matches using recent activity and local workspace metadata
2. present likely candidate matches when confidence is not high enough
3. move the UI into the correct workspace once the reference is resolved

## Scope behavior
When the assistant moves into a client or matter workspace, retrieval behavior should shift accordingly.

When working with a specific client’s documents:
- the assistant should specifically use that client’s information
- it should not pull from unrelated clients by default

When working with a specific matter:
- matter context is primary
- client context may supplement it
- outside context should not be pulled by default

This is a retrieval discipline requirement even if the app is not yet enforcing full hard sandboxing in every subsystem.

## UI design implication
Equal Scales should be designed so that:
- chat remains visible and central
- surrounding panels can change based on chat intent
- the user does not need to manually navigate through every area to get work done
- the app can fluidly surface the right panel at the right time

This means the UI should be able to morph into:
- template browsing mode
- client dashboard mode
- matter workspace mode
- draft preview mode
- document editing mode (later)
- research mode
- overall review/dashboard mode

## Engineering implication
This requires a UI routing/navigation control layer that the chat agent can invoke.

The app should eventually expose an internal command layer for actions like:
- `navigate_to_client(client_id)`
- `navigate_to_matter(matter_id)`
- `open_templates(category?)`
- `open_draft(draft_id)`
- `open_research(matter_id)`
- `open_client_dashboard(client_id)`
- `focus_panel(panel_id)`

These should be internal app actions, not ad hoc DOM hacks.

## Immediate implementation consequence
Even though the app is template-first in the near term, the coding agent must design the early phases so that:
- clients and matters are first-class addressable UI entities
- templates and drafts are first-class addressable UI entities
- future chat-driven navigation is easy to add cleanly

The coding agent should not hardcode a UI architecture that assumes manual navigation is the only model.

---

# 5. Core Architectural Decisions for the Template-First MVP

## 5.1 What stays from the current codebase
Keep:
- Electron shell
- renderer and streaming chat loop
- Claude provider integration
- backend Express app
- SSE streaming behavior
- existing theme work
- current degrade-without-Composio behavior
- preload bridge pattern

## 5.2 What changes first
Change first:
- app navigation model
- data model
- persistence model
- workflow model
- terminology from “chat” to “workspace/draft/template” where appropriate

## 5.3 What does NOT need to be built first
Do NOT build first:
- full document viewer/editor
- final Word-fidelity editing system
- enterprise multi-user permissions
- broad app integrations
- cross-client global search

---

# 6. Immediate MVP Domain Model

Equal Scales should add first-class entities for:

- Client
- Matter
- Template
- Draft
- Conversation
- SourceDocument
- Task

## 6.1 Client
Represents the organization/person being served.

Suggested fields:
- id
- slug
- name
- display_name
- status
- created_at
- updated_at
- root_path

## 6.2 Matter
Represents a legal engagement or workstream under a client.

Suggested fields:
- id
- client_id
- slug
- name
- matter_type
- status
- created_at
- updated_at
- matter_path

## 6.3 Template
Represents a reusable legal starting document.

Suggested fields:
- id
- slug
- name
- template_type
- description
- file_format
- source_path
- placeholders_json
- tags_json
- created_at
- updated_at

## 6.4 Draft
Represents a generated or manually created document for a specific client/matter.

Suggested fields:
- id
- client_id
- matter_id nullable
- template_id nullable
- title
- draft_type
- file_format
- file_path
- version
- status
- created_at
- updated_at

## 6.5 Conversation
Keeps the current agent interaction model, but linked to a workspace.

Suggested fields:
- id
- client_id nullable
- matter_id nullable
- title
- provider
- provider_session_id
- created_at
- updated_at

---

# 7. Recommended Local Filesystem Structure for the MVP

Templates must be local.
Clients and matters must be local.
Drafts must be local.

Recommended root:
- `~/EqualScalesVault/`

Recommended structure:

```text
EqualScalesVault/
  templates/
    engagement-letters/
      standard-engagement-letter.md
      litigation-engagement-letter.md
    intake/
      client-intake-checklist.md
      matter-intake-summary.md
    disputes/
      demand-letter.md
      settlement-summary.md
    estate/
      simple-will.md
      power-of-attorney.md

  clients/
    client_001-jane-doe/
      profile.md
      notes.md
      matters/
        matter_2026-001-estate-planning/
          matter.md
          facts.md
          tasks.md
          drafts/
            2026-04-08-simple-will-v1.md
            2026-04-08-simple-will-v2.md
          source-documents/
            intake-questionnaire.pdf
            prior-will.docx
```

This should be generated by the application.
Not left to the user to manually organize.

---

# 8. Template Strategy

Templates should become a first-class section of the app.

## 8.1 Initial template format
For the first MVP, use Markdown templates.

Why:
- easy to store locally
- easy to diff
- easy for agents to manipulate
- easy to preview
- avoids immediate DOCX complexity

Later:
- support DOCX-backed templates
- or dual templates (Markdown internal, DOCX export)

## 8.2 Template composition
Each template should support:
- frontmatter metadata
- placeholder fields
- optional instruction blocks
- optional agent notes for filling rules

Example:

```yaml
---
type: template
name: Simple Will
slug: simple-will
template_type: estate
format: markdown
placeholders:
  - client_full_name
  - client_address
  - executor_name
  - beneficiaries
  - specific_bequests
---
```

Then body content may contain placeholders like:
- `{{client_full_name}}`
- `{{client_address}}`
- `{{executor_name}}`

Or section markers like:
- `[[SECTION:BENEFICIARIES]]`

## 8.3 Template section semantics
Templates should not only be flat placeholder bags.
They should support sections the agent can rewrite more intelligently.

For example:
- recital section
- client facts section
- beneficiary section
- signature section

This allows the agent to:
- clone template
- resolve direct fields
- then rewrite specific sections with contextual reasoning

---

# 9. Why Markdown Templates First Is the Right Move

Markdown templates first gives us:
- low-friction local templating
- fast agent integration
- strong diffability
- strong inspectability
- reduced implementation risk
- fast preview support

This is exactly what we need before introducing a DOCX editor.

The goal is not to avoid Word forever.
The goal is to prove the drafting workflow first.

---

# 10. Workspace Model

## 10.1 Client-centric workspaces
Each client should have:
- profile
- notes
- matters list
- drafts list
- source docs list

## 10.2 Matter-centric sub-workspaces
Each matter should have:
- matter summary
- facts
- tasks
- drafts
- source documents
- conversations

## 10.3 Agent context rules
Inside a matter:
- agent gets matter context first
- then optional client profile context
- never unrestricted all-client context by default

Inside a client workspace:
- agent gets client profile context
- can optionally inspect linked matters when explicitly necessary

---

# 11. Current Renderer Implications

Because the current renderer is still chat-first, the coding agent should NOT attempt a total rewrite in one shot.

Instead:
- preserve the working chat stream architecture
- progressively evolve the left sidebar into workspace navigation
- progressively reduce the centrality of raw chat history

Current observed renderer assumptions that must be refactored over time:
- `allChats` as the core local state model
- `chatHistoryList` as the primary left navigation container
- current home screen still centered on generic prompting
- model/provider controls still prominent in UX

This means we should do an incremental migration, not a scorched-earth rewrite.

---

# 12. Recommended Implementation Sequence

## Phase 0 — Preserve and stabilize current shell
Objective:
- keep the currently working Equal Scales shell intact
- do not regress current dark mode, branding, or chat behavior

## Phase 1 — Add storage foundations
Objective:
- create local vault path strategy
- add SQLite initialization
- add repository layer for clients/matters/templates/drafts

## Phase 2 — Introduce client and matter workspaces
Objective:
- create first-class backend entities
- create basic frontend navigation for them
- link conversations to client/matter context

## Phase 3 — Add template library
Objective:
- create local template storage
- build backend APIs for templates
- show templates in UI

## Phase 4 — Implement template clone/fill workflow
Objective:
- choose client/matter
- choose template
- clone locally
- fill placeholders/sections with agent
- save draft

## Phase 5 — Add draft management and preview
Objective:
- list drafts
- version drafts
- preview drafts
- basic edit/regenerate flows

## Phase 6 — Add richer source-document and review support
Objective:
- attach source docs
- contextual drafting from source docs
- approval/revision groundwork
- optional simple DOCX export

The full viewer/editor should come after this.

---

# 13. What the Coding Agent Should Explicitly Avoid Right Now

Do not:
- build unrestricted global search across all clients/matters
- replace the whole app with a new framework
- build a full document editor first
- make Composio a dependency for the drafting MVP
- introduce cloud persistence
- make the canonical MVP depend on DOCX editing
- implement overengineered permissions before the single-user local workflow exists

---

# 14. Phase-by-Phase Detailed Implementation Plan

## Phase 0 — Stabilize Existing Equal Scales Shell

### Goals
- confirm current rebrand and dark mode remain intact
- avoid regressions while adding new structure
- document the current shell assumptions in code comments where helpful

### Specific instructions
- do not remove existing theme logic
- do not remove existing streaming logic
- keep `sendMessage` and backend chat flow functional
- avoid changing provider architecture more than necessary in this phase

### Files likely involved
- `renderer/index.html`
- `renderer/renderer.js`
- `renderer/style.css`
- `main.js`
- `preload.js`

### Coding-agent prompt for Phase 0

```text
Task: Stabilize the current Equal Scales shell before deeper feature work.

Context:
- The codebase is a modified Open Claude Cowork repo.
- Branding has already been changed to Equal Scales in package.json, README, setup.sh, and renderer UI.
- Dark mode/theme toggle has already been added and must not regress.
- The app currently still behaves as a chat-first app with localStorage-backed sessions.
- The backend has already been patched so it can run without COMPOSIO_API_KEY.

Goals:
1. Verify current branding and dark mode are preserved.
2. Add minimal code comments or structure cleanup only where it reduces future confusion.
3. Do not rewrite renderer architecture in this phase.
4. Keep current chat loop and streaming functionality working.

Constraints:
- no product redesign yet
- no large UI rewrites
- no new persistence model yet
- no breaking changes to current Electron startup or backend chat

Deliverables:
- small cleanup only if needed
- note any technical debt hotspots that later phases must address
- ensure app still runs
```

---

## Phase 1 — Local Vault + SQLite Foundations

### Goals
- create local filesystem root for Equal Scales data
- create SQLite DB
- define first schema
- add data access layer

### Required components
- path resolution module
- vault bootstrap module
- SQLite bootstrap module
- migrations/schema file(s)
- backend repository layer

### Required entities
- clients
- matters
- templates
- drafts
- conversations
- messages

### Suggested new backend modules
- `server/storage/paths.js`
- `server/storage/db.js`
- `server/storage/schema.sql`
- `server/storage/repositories/clients.js`
- `server/storage/repositories/matters.js`
- `server/storage/repositories/templates.js`
- `server/storage/repositories/drafts.js`

### Coding-agent prompt for Phase 1

```text
Task: Add Equal Scales local storage foundations.

Current codebase notes:
- The app is still chat-first and uses localStorage in the renderer for chat state.
- We are not replacing that yet, but we are introducing the real backend storage foundation now.
- The app already runs locally via Electron + Node/Express.

Goals:
1. Create a local Equal Scales vault path strategy.
2. Create and initialize a local SQLite database.
3. Add first schema for clients, matters, templates, drafts, conversations, messages.
4. Add backend repository modules for these entities.
5. Make initialization idempotent and safe.

Requirements:
- use local-only storage
- do not depend on cloud services
- do not migrate all renderer state in this phase
- keep implementation easy to inspect
- prefer boring, explicit modules over abstractions that hide behavior

Recommended outputs:
- storage path module
- DB bootstrap module
- schema SQL or migration files
- repository files
- startup initialization hook in the backend

Do not:
- build UI for these entities yet beyond what is needed for smoke testing
- remove current chat functionality
```

---

## Phase 2 — Client and Matter Workspaces

### Goals
- create first-class client and matter backend APIs
- create filesystem folders for them
- create initial workspace markdown files
- adapt the UI to display them

### Client workspace files to generate
- `profile.md`
- `notes.md`

### Matter workspace files to generate
- `matter.md`
- `facts.md`
- `tasks.md`
- `drafts/`
- `source-documents/`

### Frontend expectation
The left sidebar should begin evolving from:
- chat history only

Into:
- clients
- matters
- templates
- drafts
- with chat still existing inside workspaces

### Coding-agent prompt for Phase 2

```text
Task: Introduce client and matter workspaces into Equal Scales.

Context:
- Backend storage foundations now exist or are being introduced.
- The current UI is still chat-first and uses chat history in the left sidebar.
- We want to begin shifting the app to a workspace model without a full rewrite.

Goals:
1. Add backend CRUD or create/list/read routes for clients and matters.
2. On client creation, create a client directory in the local vault.
3. On matter creation, create a matter directory under the client.
4. Create canonical starter markdown files for clients and matters.
5. Add minimal frontend navigation to list/select clients and matters.
6. Preserve existing chat behavior, but allow conversations to be linked to a client/matter context.

Requirements:
- stable IDs independent of display names
- deterministic folder naming
- markdown files should be human-readable
- no global search or unrestricted cross-workspace context

Deliverables:
- backend routes/services
- vault creation logic
- initial frontend panels or navigation affordances
- workspace selection state model
```

---

## Phase 3 — Template Library

### Goals
- create a first-class template library
- store templates locally
- expose templates via backend and UI

### Template storage recommendation
Use:
- `~/EqualScalesVault/templates/`

Suggested categories:
- intake
- estate
- litigation
- contracts
- client-communications

### MVP template format
Markdown with frontmatter.

### Suggested template backend modules
- `server/templates/template-service.js`
- `server/templates/template-parser.js`
- `server/routes/templates.js`

### Coding-agent prompt for Phase 3

```text
Task: Add a local template library to Equal Scales.

Context:
- Equal Scales is moving to a template-first legal drafting workflow.
- Templates must live on the local machine.
- We are intentionally starting with Markdown templates, not a full DOCX template editor.

Goals:
1. Add a local templates root and category structure.
2. Support listing templates from the backend.
3. Parse template metadata from frontmatter.
4. Add a basic Templates section in the frontend.
5. Show template type, name, description, and category.

Requirements:
- templates are local files
- no cloud dependency
- metadata should be explicit and validated
- implementation should not require a document viewer/editor yet

Deliverables:
- template file schema
- template service/parser
- frontend template list UI
- a few sample templates if needed for testing
```

---

## Phase 4 — Template Clone and Fill Workflow

### Goals
- choose client/matter
- choose template
- clone template into draft
- fill placeholders and sections with agent assistance
- save locally

### Core UX
The user should be able to:
1. open a client or matter workspace
2. click `Create Draft from Template`
3. select a template
4. choose whether to draft against:
   - client scope only
   - current matter scope
5. send a drafting instruction to the agent
6. receive a created draft file in the workspace

### Backend workflow shape
- template selected
- template file loaded
- destination path created
- workspace context gathered
- prompt assembled
- agent fills fields/rewrites sections
- resulting draft saved
- draft metadata registered in SQLite

### Suggested draft-generation module
- `server/drafts/generate-draft.js`

### Coding-agent prompt for Phase 4

```text
Task: Implement the Equal Scales template clone/fill workflow.

Context:
- Clients and matters now exist as first-class workspaces.
- Templates are stored locally and listed in the app.
- The current app already has a working agent interaction loop through Claude Agent SDK.

Goals:
1. Let the user select a template from a client or matter context.
2. Clone that template into a new draft in the correct workspace.
3. Gather scoped context from the selected client and/or matter files.
4. Build a prompt for the agent to fill placeholders and rewrite relevant sections.
5. Save the resulting draft locally.
6. Register the draft in SQLite.

Requirements:
- never use unrestricted global workspace context by default
- matter scope should be the default when inside a matter
- preserve template metadata lineage where useful
- save drafts in deterministic locations
- do not require a full document editor yet

Deliverables:
- backend draft-generation service
- UI flow for choosing template + generating draft
- draft persistence and registration
- error handling for missing placeholders/context
```

---

## Phase 5 — Draft Management and Preview

### Goals
- list drafts
- open draft preview
- support versioning
- support regenerate/update flow

### Preview recommendation for MVP
For Markdown templates/drafts:
- render Markdown to HTML in-app
- allow raw source view toggle if helpful

This is enough before a full editor.

### Suggested frontend sections
- Drafts list panel
- Draft detail panel
- Preview tab
- Source tab
- Regenerate/Revise action buttons

### Coding-agent prompt for Phase 5

```text
Task: Add draft management and preview to Equal Scales.

Context:
- Drafts can now be generated from templates and saved locally.
- The app does not yet have a full document editor.
- We need a useful review experience before that exists.

Goals:
1. Add a Drafts section to the UI.
2. List drafts by client and matter.
3. Open and preview a draft in-app.
4. Track draft versions.
5. Support a revise/regenerate workflow that creates a new version instead of destroying the old one.

Requirements:
- local-only files
- versioning should be explicit
- preserve earlier drafts
- preview should be simple and reliable
- no heavy document viewer/editor dependency yet

Deliverables:
- draft list UI
- preview pane
- version handling logic
- revise/regenerate flow
```

---

## Phase 6 — Source Documents + Better Context + Review Groundwork

### Goals
- attach source docs to matters
- use them in draft generation
- prepare review/approval layer

### This phase should add
- source document registration
- matter source-doc UI list
- context assembly service
- retrieval guardrails
- early approval state fields for drafts

### Coding-agent prompt for Phase 6

```text
Task: Add source-document support and review groundwork to Equal Scales.

Context:
- The core template and draft loop already exists.
- We now want richer drafting from attached source materials.
- We are still not building the full final document editor yet.

Goals:
1. Allow local source documents to be attached to a client or matter.
2. Register those documents in backend storage metadata.
3. Make draft generation able to use attached source documents as context.
4. Add basic draft status values like draft, awaiting_review, revised.
5. Begin laying groundwork for later approval flows.

Requirements:
- no cloud upload dependency
- source context must remain scoped
- do not silently mix unrelated matters
- keep all file operations local and inspectable

Deliverables:
- source document ingest/register flow
- context assembly module
- draft status model updates
- minimal UI for viewing attached source docs list
```

---

# 15. Prompting Patterns for the Drafting Agent Itself

These prompts are not build prompts. These are runtime drafting prompts you may eventually use inside Equal Scales.
They are included here so the coding agent understands the intended workflow shape.

## 15.1 Template fill prompt skeleton

```text
You are drafting a document for Equal Scales.

Current scope:
- Client: {{client_name}}
- Matter: {{matter_name_or_none}}
- Scope level: {{scope_label}}

Task:
Clone the selected template and fill it for this client/matter using only the provided context.

Instructions:
1. Preserve the template structure unless a section clearly requires rewriting.
2. Fill explicit placeholders where reliable values are present.
3. If a placeholder cannot be resolved confidently, leave a clear marker for human review instead of fabricating.
4. Use only the provided client/matter/source context.
5. Do not infer facts not supported by the provided context.
6. Keep the output professional and ready for attorney review.
7. If legal-specific uncertainty exists, mark it as REVIEW REQUIRED.

Output requirements:
- Return the completed draft content only.
- Preserve headings and sections.
- Leave unresolved items in visible review markers.
```

## 15.2 Section-rewrite prompt skeleton

```text
You are revising one section of an Equal Scales legal draft.

Document context:
- Draft title: {{draft_title}}
- Section: {{section_name}}
- Client: {{client_name}}
- Matter: {{matter_name}}

Task:
Rewrite only the specified section using the provided context.

Rules:
- Do not change other sections.
- Do not add unsupported facts.
- Preserve formal tone and template style.
- If information is missing, leave a REVIEW REQUIRED marker.
```

---

# 16. Technical Debt Notes the Coding Agent Should Know Up Front

## 16.1 Current renderer state is monolithic
`renderer/renderer.js` is already large and stateful.
The coding agent should avoid making it worse.

Recommendation:
- gradually split it into modules
- but do not do a destabilizing full rewrite in the same phase as new features

Potential future split:
- `renderer/state/theme.js`
- `renderer/state/chats.js`
- `renderer/state/workspaces.js`
- `renderer/ui/templates.js`
- `renderer/ui/drafts.js`
- `renderer/ui/clients.js`
- `renderer/ui/matters.js`

## 16.2 localStorage chat model must be transitional
It is okay to leave current chat localStorage in place while new systems come online.
But the coding agent should treat it as transitional.

## 16.3 README/setup are partially rebranded but not yet architecture-accurate
The documentation currently still reflects the old app architecture in many places.
This should be fixed later, not necessarily immediately in the same phase as core feature work.

---

# 17. Recommended File Additions for the Coding Agent

The coding agent should expect to add some or all of the following over the next phases:

Backend:
- `server/storage/paths.js`
- `server/storage/db.js`
- `server/storage/schema.sql`
- `server/repositories/clients.js`
- `server/repositories/matters.js`
- `server/repositories/templates.js`
- `server/repositories/drafts.js`
- `server/services/vault-service.js`
- `server/services/template-service.js`
- `server/services/draft-service.js`
- `server/services/context-service.js`
- `server/routes/clients.js`
- `server/routes/matters.js`
- `server/routes/templates.js`
- `server/routes/drafts.js`

Renderer/front-end:
- `renderer/modules/theme.js` (optional early extraction)
- `renderer/modules/workspaces.js`
- `renderer/modules/templates.js`
- `renderer/modules/drafts.js`
- `renderer/modules/clients.js`
- `renderer/modules/matters.js`

Vault templates:
- `server/templates/default/client-profile.md`
- `server/templates/default/matter.md`
- `server/templates/default/facts.md`
- `server/templates/default/tasks.md`
- `server/templates/library/...`

---

# 18. Acceptance Criteria for the Template-First MVP

The MVP should be considered successful when the following are true:

1. A user can create a client workspace locally.
2. A user can create a matter under a client.
3. Templates are stored locally and visible in the app.
4. A user can select a template from a client/matter workflow.
5. The agent can generate a draft from that template using scoped context.
6. The draft is saved locally in the correct workspace.
7. The draft appears in a draft list.
8. The draft can be previewed in-app.
9. Older draft versions remain accessible.
10. The workflow works without any cloud storage dependency.

---

# 19. Final Recommendation to the Coding Agent

Do not solve the wrong problem first.

Do not begin with the full document editor.
Do not begin with broad integrations.
Do not begin with a giant UI rewrite.

Instead:
- keep the current Equal Scales shell alive
- add local storage foundations
- build clients and matters
- add local template management
- implement clone/fill draft generation
- add draft preview/versioning

That is the shortest path to proving Equal Scales.

---

# 20. Immediate Next Task Recommendation

The next implementation step after this document should be:

1. Phase 1 — local vault + SQLite foundations
2. Phase 2 — client and matter workspaces
3. Phase 3 — template library

This is the correct sequence.

---

# 21. Optional Meta Prompt for the Coding Agent to Use This Whole Spec

```text
You are implementing Equal Scales from the current modified codebase at /Users/bailey/Projects/open-claude-cowork.

Use the spec document at:
/docs/plans/2026-04-08-equal-scales-template-first-implementation-spec.md

Follow it exactly.

Important context:
- The codebase has already been partially rebranded to Equal Scales.
- Dark mode/theme toggle already exists and must not regress.
- Backend degraded-mode behavior without COMPOSIO_API_KEY already exists and must remain functional.
- The current app is still chat-first, but the next product direction is template-first legal drafting.
- We are intentionally building client workspaces, matter workspaces, local templates, and draft generation before a full document viewer/editor.

Your job:
- implement in phases
- preserve working behavior while evolving architecture
- avoid giant rewrites unless explicitly necessary
- prefer local-first, inspectable, explicit code
- do not introduce cloud dependencies
- do not implement unrestricted cross-client context access

When uncertain, prefer:
- simpler architecture
- scoped context
- local file ownership
- human-readable artifacts
- preserving current stability
```

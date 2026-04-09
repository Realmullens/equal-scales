# Equal Scales + MemPalace Architecture & Integration Plan

> For Hermes / coding agents: treat this as the working architecture spec for transforming Open Claude Cowork into Equal Scales, a matter-centered legal co-working desktop application. Do not implement features outside this document unless explicitly approved.

## Document Purpose

This document explains:
- why Equal Scales should use Open Claude Cowork as the application base
- why MemPalace should be integrated as an agent memory subsystem, not the full application foundation
- how Markdown files on the user’s machine should become the legal system of record for clients and matters
- how SQLite should support workflow state, indexing, permissions, and auditability
- how retrieval scope should work to avoid cross-client leakage
- what coding agents should implement, in what order, and with what prompts

This is intentionally detailed. The goal is to remove ambiguity so coding agents can execute with minimal guessing.

---

# 1. Executive Summary

Equal Scales should be built as a local-first legal co-working application with three distinct memory/data layers:

1. App shell and interaction layer:
   - Open Claude Cowork (Electron desktop app + Node/Express backend + Claude Agent SDK integration)

2. Agent memory layer:
   - MemPalace, used for long-horizon agent memory, conversational recall, and reusable context
   - This is assistive memory, not the legal source of truth

3. Legal knowledge layer:
   - Markdown files on the user’s local filesystem
   - Organized by client and matter
   - These files are the human-readable, portable, inspectable record of facts, timelines, drafts, approvals, source notes, and matter context

Supporting these three layers should be:
- SQLite as the application metadata and workflow state store
- Retrieval and scope enforcement logic to constrain agent context by matter and client
- Explicit provenance, source linking, review flow, and audit logging

This architecture aims to preserve:
- local-first ownership
- inspectable legal records
- high-quality AI memory and retrieval
- matter-scoped safety boundaries
- a viable product path from MVP to production

---

# 2. Why We Are Using Open Claude Cowork as the Base

Open Claude Cowork is not the final Equal Scales product, but it is a strong starting shell because it already provides:

- an Electron desktop wrapper
- a usable chat UI
- a Node/Express streaming backend
- Claude Agent SDK integration
- per-chat session handling
- a provider abstraction layer
- message streaming via server-sent events
- a side panel / chat history UX pattern
- a product-shaped desktop application experience

This means we are not starting from zero.

We are not choosing Open Claude Cowork because it is already a legal application. It is not.
We are choosing it because it already solves:
- desktop app shell
- agent streaming interaction loop
- basic session UX
- application wiring between frontend and backend

That lets us spend our effort on the true Equal Scales differentiators:
- matters
- clients
- document intelligence
- legal memory
- citations and provenance
- review/approval workflows
- legal-safe retrieval boundaries

---

# 3. Why We Are Not Using Open Claude Cowork “As-Is”

Open Claude Cowork is currently shaped like a general AI cowork chat app.

Equal Scales must instead become:
- a matter-centered legal workspace
- where AI is embedded inside legal workflows
- not simply a general-purpose chat surface with legal prompts

What must change:
- generic multi-chat becomes matter workspaces
- browser localStorage persistence becomes a real local database and filesystem-backed knowledge model
- generic provider/model switching becomes a legal workflow-oriented interface
- generic tool integrations become optional, carefully controlled legal integrations
- generic conversation memory becomes scoped matter/client/legal memory

Equal Scales should not be “Claude with a legal wrapper.”
Equal Scales should be “a legal operating workspace with AI inside it.”

---

# 4. Why We Are Considering MemPalace

MemPalace appears valuable because it emphasizes:
- long-term AI memory
- local-first operation
- verbatim storage rather than over-summarized memory extraction
- high recall over long histories
- a structured memory system rather than a flat transcript dump

These are all highly relevant to Equal Scales.

Legal work is memory-heavy across time:
- client history
- procedural posture
- issue evolution
- factual updates
- document relationships
- changes in strategy
- prior drafts and review notes
- negotiations and communications

MemPalace can potentially help preserve long-range agent memory in a way that improves:
- consistency across sessions
- continuity of work
- recall of prior reasoning
- re-use of prior insights

This is especially useful for:
- ongoing matters
- repeated user interaction over months
- recurring legal workflows
- long-lived client relationships

---

# 5. Why We Are NOT Making MemPalace the System of Record

This is one of the most important architectural decisions.

MemPalace should not be the canonical legal record.

Reasons:

1. Legal records must be inspectable and deterministic
   - We need clear, human-readable records for facts, timelines, drafts, approvals, and sources
   - Legal knowledge should not live primarily in opaque agent memory internals

2. Legal outputs require provenance
   - The system must know where facts came from
   - It must distinguish between:
     - user-entered facts
     - extracted document content
     - AI-generated summaries
     - reviewed and approved drafts

3. Legal workflows require stronger boundaries than generic agent memory
   - matter isolation
   - client isolation
   - privilege-sensitive context
   - approval and audit traceability

4. Long-term agent memory and legal source-of-truth are different things
   - Agent memory is best used as assistive recall
   - Legal record should be stable, structured, and reviewable

Therefore:
- MemPalace = assistive memory layer
- Markdown + SQLite = legal knowledge and workflow system of record

---

# 6. Core Architectural Principle

Equal Scales should have three different but cooperating layers:

## Layer A: Agent Memory Layer
Used for:
- conversation recall
- reusable context from prior sessions
- agent learning about recurring workflows
- long-term memory across usage
- helpful context for the AI agent

Candidate technology:
- MemPalace

This layer is NOT the final legal source of truth.

## Layer B: Legal Knowledge Layer
Used for:
- client profiles
- matter summaries
- facts
- issues
- timeline events
- source notes
- drafts
- approvals
- conversations and meeting notes

Candidate format:
- Markdown files with strict YAML frontmatter schemas

This layer IS the human-readable legal knowledge base.

## Layer C: App Metadata / Workflow Layer
Used for:
- file registry
- chat/matter linkage
- permissions
- indexing state
- embedding/chunk metadata
- workflow status
- approval state
- audit log
- search scope enforcement

Candidate technology:
- SQLite

This layer supports app behavior and state.

---

# 7. The “Best of Both Worlds” Strategy

The desired architecture is:

- MemPalace stores agent memory and prior interaction recall
- Markdown stores matter and client knowledge artifacts directly on disk
- SQLite stores app state and structured metadata
- the Equal Scales app orchestrates scoped retrieval among them

This gives us:
- local-first ownership
- portable legal files
- strong long-term agent memory
- transparent legal records
- high adaptability
- less vendor lock-in
- easier debugging and auditing

That is the design we are implementing.

---

# 8. The Biggest Risk: Cross-Client Leakage

If the agent can freely search across all markdown files for all clients and all matters by default, that is dangerous.

This architecture must NEVER default to unrestricted global search.

Default retrieval scope must be:
1. Current matter
2. Current client (only when needed)
3. Explicit cross-matter search within current client
4. Explicit global/admin search with visible warnings

This must be enforced by the app, not merely suggested in prompts.

The system should assume that unrestricted search across all clients is a risk vector.

Potential harms of bad scope control:
- confidentiality leakage
- mixed factual records
- privilege contamination
- accidental exposure of one client’s information in another matter
- poor answer quality due to irrelevant context overload

Therefore scope enforcement is a first-class architecture requirement.

---

# 9. Recommended Data Model

Equal Scales should organize information around these core entities:

- User
- Client
- Matter
- MatterConversation
- Message
- Document
- SourceReference
- Fact
- Issue
- TimelineEvent
- Draft
- Approval
- Task
- AuditEvent

In the MVP, some of these may be represented primarily through Markdown files, but the conceptual model should already exist.

---

# 10. Filesystem / Vault Layout

All legal knowledge should live in a predictable local vault.

Recommended root:
`~/EqualScalesVault/`

Recommended structure:

```text
EqualScalesVault/
  clients/
    client_001-acme-corp/
      profile.md
      contacts.md
      overview.md
      matters/
        matter_2026-001-contract-dispute/
          matter.md
          facts.md
          issues.md
          timeline.md
          strategy.md
          tasks.md
          conversations/
            2026-04-08-intake-call.md
            2026-04-11-client-followup.md
          drafts/
            2026-04-12-demand-letter-v1.md
            2026-04-13-demand-letter-v2.md
          approvals/
            2026-04-13-demand-letter-approval.md
          sources/
            contract-master-services-agreement.md
            invoice-2026-03-14.md
            email-2026-04-07-payment-dispute.md
          documents/
            contract-master-services-agreement.pdf
            invoice-2026-03-14.pdf
            email-export-2026-04-07.eml
```

This structure should be generated and managed by the app, not hand-waved to users.

---

# 11. Markdown File Types We Should Support

At minimum:

Client-level
- profile.md
- contacts.md
- overview.md

Matter-level
- matter.md
- facts.md
- issues.md
- timeline.md
- strategy.md
- tasks.md

Matter subfolders
- conversations/*.md
- drafts/*.md
- approvals/*.md
- sources/*.md
- documents/* (raw source files, not necessarily markdown)

Optional later
- research/*.md
- authorities/*.md
- exhibits/*.md
- filing-history/*.md

---

# 12. Frontmatter Requirements

Every Markdown file should include YAML frontmatter.

This is mandatory.

Why:
- reliable scoping
- metadata extraction
- search filtering
- provenance support
- workflow state tracking
- agent context construction

## Example: Client profile

```yaml
---
type: client_profile
client_id: client_001
client_name: Acme Corp
confidentiality: privileged
status: active
created_at: 2026-04-08T10:00:00Z
updated_at: 2026-04-08T10:00:00Z
tags:
  - corporate
  - contracts
---
```

## Example: Matter summary

```yaml
---
type: matter_summary
client_id: client_001
matter_id: matter_2026_001
matter_name: Contract Payment Dispute
matter_status: active
practice_area: commercial_litigation
confidentiality: privileged
created_at: 2026-04-08T10:05:00Z
updated_at: 2026-04-08T10:05:00Z
---
```

## Example: Timeline event

```yaml
---
type: timeline_event
client_id: client_001
matter_id: matter_2026_001
event_date: 2026-03-14
event_kind: invoice_sent
source_refs:
  - source_id: source_invoice_2026_03_14
    page: 1
confidence: high
created_at: 2026-04-08T10:10:00Z
updated_at: 2026-04-08T10:10:00Z
---
```

## Example: Draft document

```yaml
---
type: draft
client_id: client_001
matter_id: matter_2026_001
draft_type: demand_letter
version: 2
status: awaiting_review
derived_from:
  - facts.md
  - timeline.md
  - source_invoice_2026_03_14
created_at: 2026-04-13T14:00:00Z
updated_at: 2026-04-13T14:45:00Z
---
```

## Example: Approval record

```yaml
---
type: approval_record
client_id: client_001
matter_id: matter_2026_001
artifact_type: draft
artifact_path: drafts/2026-04-13-demand-letter-v2.md
approval_status: approved
approved_by: bailey_mullens
approved_at: 2026-04-13T15:03:00Z
created_at: 2026-04-13T15:03:00Z
updated_at: 2026-04-13T15:03:00Z
---
```

---

# 13. What Markdown Should Store vs What SQLite Should Store

## Markdown should store
- durable knowledge content
- matter narratives
- client profiles
- facts and issue lists
- timelines
- drafts
- source notes
- approvals as readable records
- conversation summaries or transcripts

## SQLite should store
- file registry and IDs
- client and matter indexes
- current active conversation IDs
- chat-to-matter linkage
- search indexes/chunk references
- embeddings metadata
- retrieval scope rules
- permissions and access settings
- workflow status values
- audit logs
- ingestion states
- last indexed timestamps

This split is intentional.

Markdown = content and human truth
SQLite = app mechanics and structured operations

---

# 14. Why This Split Is Better Than “Everything in Markdown”

If everything is only Markdown, the app becomes too hard to coordinate.

Problems with Markdown-only for all state:
- harder to manage indexing state reliably
- harder to enforce permissions and scoping consistently
- harder to maintain audit integrity
- harder to query fast for UI needs
- harder to track relationships and workflow state cleanly

Problems with DB-only:
- less transparent
- less portable
- more lock-in
- harder for users to inspect or export

The hybrid architecture gives us:
- transparency of local files
- discipline of structured metadata
- better UX and faster queries
- stronger maintainability

---

# 15. Retrieval Scope Rules

These rules must be implemented at the orchestration layer.

## Scope levels

### Scope 1: Matter scope (default)
Load/search only:
- current matter markdown files
- matter documents
- matter source notes
- matter drafts
- matter approvals
- matter conversations

### Scope 2: Client scope (optional, bounded)
Load/search:
- current matter
- client profile
- client overview
- optionally related matters for the same client

Only used when relevant.

### Scope 3: Cross-matter within client (explicit)
The user or workflow must explicitly request cross-matter search inside the current client.

### Scope 4: Global search (admin/explicit only)
Search across all clients and matters only when:
- explicitly requested
- clearly visible in the UI
- accompanied by warnings
- logged to the audit layer

## UI requirement
The active scope must be visible.

Example UI labels:
- Scope: This Matter
- Scope: This Client
- Scope: Client Matters
- Scope: All Matters (warning)

## Agent requirement
The agent should always be told explicitly what scope it has.
It should never infer global permission from silence.

---

# 16. Recommended Context Assembly Strategy

When a user is inside a matter, the backend should assemble context in this order:

1. matter.md
2. facts.md
3. issues.md
4. timeline.md
5. strategy.md (if present)
6. recent tasks
7. recent drafts
8. recent approvals
9. top relevant source notes
10. optionally client profile if needed
11. optionally MemPalace recall results scoped to matter/client context

This context assembly should be deliberate and limited.
It should not dump everything in the vault into the prompt.

Use a retrieval budget.
Use source prioritization.
Use recency and metadata.

---

# 17. How MemPalace Should Fit

## MemPalace should be used for
- prior interaction recall
- long-range conversational memory
- remembering prior legal workflow decisions
- remembering why specific preferences or workflows exist
- improving continuity across sessions

## MemPalace should not be used for
- final source-of-truth for facts
- final source-of-truth for approvals
- final source-of-truth for legal documents
- unrestricted retrieval across all matters by default

## Conceptual role
MemPalace is the agent’s memory assistant.
The vault is the legal workspace.
SQLite is the app’s operational spine.

---

# 18. Why MemPalace Is Useful Here

MemPalace helps because legal work is not stateless.

Without memory, the system repeatedly loses:
- prior reasoning
- prior user instructions
- previous strategy discussions
- ongoing preferences about a matter
- prior legal workflow decisions

This leads to:
- repeated re-explanation
- lower continuity
- inconsistent outputs
- poor user trust

MemPalace can improve:
- continuity of legal collaboration
- recall of why prior decisions were made
- smoother agent performance over long-lived matters
- better support for months-long client engagements

That is why we are implementing it.

---

# 19. Why We Are NOT Letting MemPalace Search Everything by Default

Even if MemPalace can search broadly, Equal Scales must constrain it.

The app should sit between the user and memory.

That means:
- Equal Scales decides what memory scope is appropriate
- MemPalace gets scoped queries and context windows
- it does not receive unrestricted access to all client matter data unless explicitly authorized by the workflow

The architecture should prefer safe orchestration over permissive raw capability.

---

# 20. Proposed MVP Architecture

## Frontend
- Electron shell
- adapted renderer UI
- matter-centric navigation
- matter detail workspace
- document panel
- draft panel
- source panel
- task panel
- visible scope selector

## Backend
- Node/Express
- route layer for matters, clients, documents, drafts, search, approvals
- Claude Agent SDK provider
- MemPalace adapter layer
- vault access layer
- SQLite metadata service
- retrieval orchestration layer

## Storage
- vault on filesystem
- SQLite database in app support directory
- optional embeddings/chunk indexes stored locally

---

# 21. Recommended Local Paths

Vault:
- `~/EqualScalesVault/`

App data:
- `~/Library/Application Support/EqualScales/` on macOS

SQLite DB:
- `~/Library/Application Support/EqualScales/equal-scales.db`

Indexes/cache:
- `~/Library/Application Support/EqualScales/indexes/`

MemPalace integration data:
- either embedded in its own local directory under app support
- or configured in a dedicated subdirectory such as:
  - `~/Library/Application Support/EqualScales/mempalace/`

---

# 22. SQLite Schema (Initial Recommendation)

At minimum, create tables like:

## clients
- id
- slug
- name
- status
- root_path
- created_at
- updated_at

## matters
- id
- client_id
- slug
- name
- status
- matter_path
- practice_area
- created_at
- updated_at

## vault_files
- id
- client_id
- matter_id nullable
- relative_path
- absolute_path
- file_type
- frontmatter_json
- checksum
- indexed_at
- updated_at

## conversations
- id
- matter_id nullable
- client_id nullable
- title
- provider
- provider_session_id
- created_at
- updated_at

## messages
- id
- conversation_id
- role
- content_text
- raw_json
- created_at

## source_references
- id
- matter_id
- source_label
- file_path
- page_ref nullable
- source_type
- created_at

## drafts
- id
- matter_id
- file_path
- draft_type
- version
- status
- created_at
- updated_at

## approvals
- id
- matter_id
- artifact_type
- artifact_path
- status
- approved_by
- approved_at
- created_at

## audit_events
- id
- actor_type
- actor_id nullable
- event_type
- matter_id nullable
- client_id nullable
- payload_json
- created_at

## retrieval_events
- id
- conversation_id nullable
- matter_id nullable
- client_id nullable
- scope_level
- query_text
- files_considered_json
- files_selected_json
- created_at

---

# 23. Search / Retrieval Design

The retrieval system should query across:
- Markdown note content
- frontmatter metadata
- source note content
- conversation summaries/transcripts
- MemPalace results (if enabled and scoped)

The retrieval engine should support:
- keyword search
- semantic search
- metadata filtering
- scope constraints
- source ranking

The retrieval pipeline should return:
- selected files
- reason for selection
- snippets or relevant sections
- source references
- scope label

---

# 24. Canonical Rule: Source Traceability

Every meaningful factual output should be traceable.

If the app states:
- a date
- a contract term
- a payment amount
- a procedural event
- a client fact

Then the system should be able to answer:
- which file supported this
- where in the file it came from
- whether it was extracted or user-authored

This is a hard requirement for Equal Scales.

MemPalace recall can be useful for continuity, but it must not silently replace source-grounded legal reasoning.

---

# 25. Approval Model

Nothing client-facing should be treated as final without an approval step.

Approval flow should include statuses like:
- draft
- awaiting_review
- revised
- approved
- finalized
- sent

Approval records should be:
- human-readable in Markdown
- machine-trackable in SQLite
- referenced in audit logs

---

# 26. Audit Requirements

Audit logs should capture:
- file creation
- file modification via app
- AI generation events
- retrieval scope used
- source files consulted
- approval events
- explicit global search events
- settings changes affecting access/scope

This does not need to be enterprise-perfect in the MVP, but the model should exist from day one.

---

# 27. UX Direction for Equal Scales

The app should move from “chat-first” to “matter-first.”

Recommended layout:

Left navigation:
- Matters
- Clients
- Drafts
- Tasks
- Search
- Settings

Matter workspace main area:
- chat panel
- documents panel
- notes/facts/timeline panel
- drafts panel
- sources/citations panel

Visible context indicators:
- current client
- current matter
- active retrieval scope
- approval state of current artifact

This matters because users need to understand what context the AI is using.

---

# 28. Implementation Phases

## Phase 0 — Rebrand and stabilize the shell
Goals:
- rename app to Equal Scales
- remove generic cowork branding
- keep Claude flow working
- preserve the current app loop

## Phase 1 — Add SQLite and filesystem vault scaffolding
Goals:
- create Equal Scales vault
- initialize SQLite DB
- create basic client/matter/file registry tables
- add app startup checks

## Phase 2 — Introduce client and matter objects
Goals:
- create client
- create matter
- render matter list
- open matter workspace
- link conversations to matter

## Phase 3 — Add vault-backed Markdown authoring and sync
Goals:
- generate canonical files
- read/write markdown safely
- parse frontmatter
- register files in SQLite

## Phase 4 — Add scoped retrieval and legal context assembly
Goals:
- current matter retrieval
- client scope retrieval
- visible scope UI
- retrieval event logging

## Phase 5 — Integrate MemPalace as assistive memory
Goals:
- connect or adapt MemPalace
- provide scoped recall hooks
- use it for long-horizon continuity
- enforce matter/client scope in queries

## Phase 6 — Add source grounding, drafts, and approval workflows
Goals:
- draft generation
- citations panel
- approval records
- audit event capture

## Phase 7 — Add optional integrations
Goals:
- email
- drive
- calendar
- maybe practice-management integrations
- this is where Composio can become useful

---

# 29. Why Composio Is Later, Not First

Composio is valuable for integrations.
It is not the core of Equal Scales.

Core of Equal Scales:
- matter structure
- legal memory
- source traceability
- review workflow

Composio becomes useful later for:
- Gmail
- Google Drive
- calendar
- CRM/practice tools
- other workflow automation

If we prioritize Composio too early, we risk building a generic AI app with legal branding.
If we prioritize matter memory and legal workflows first, we build a legal product.

---

# 30. Coding Agent Prompting Strategy

Below are recommended prompts for coding agents. These are not user-facing prompts. These are build prompts.

---

# 31. Master Prompt for the Coding Agent

Use this when beginning the major transformation.

```text
You are implementing Equal Scales on top of the existing Open Claude Cowork codebase.

Primary objective:
Transform the existing generic AI cowork desktop app into a matter-centered local-first legal co-working application.

Architecture constraints:
1. Open Claude Cowork remains the app shell.
2. MemPalace is an assistive agent memory subsystem, not the legal source of truth.
3. Legal matter knowledge must live in Markdown files on the user’s local filesystem.
4. SQLite must store app metadata, workflow state, retrieval events, permissions metadata, and audit logs.
5. Retrieval must default to current matter scope. Do not implement global search by default.
6. No feature should permit silent cross-client context leakage.
7. Prioritize matter/client architecture over integrations.
8. Keep the system local-first and transparent.

Implementation principles:
- prefer boring, inspectable architecture over cleverness
- use explicit file paths and typed models where possible
- preserve human-readable Markdown files as canonical knowledge artifacts
- make retrieval scope visible in the UI
- log sensitive scope-expanding actions

Do not:
- build unrestricted search across all matters by default
- treat MemPalace as the canonical legal record
- hide provenance/source information
- optimize for generic chat UX over legal workspace structure

When uncertain, choose the architecture that maximizes:
- inspectability
- scope safety
- local ownership
- source traceability
- matter-centric workflow integrity
```

---

# 32. Prompt for Phase 0: Rebrand the Shell

```text
Task: Rebrand the existing Open Claude Cowork app into Equal Scales without changing its core runtime behavior.

Goals:
- rename visible branding from Open Claude Cowork / Claude to Equal Scales where product-facing
- preserve the current chat runtime
- prepare the UI for future matter-centered navigation
- do not implement new legal logic yet

Requirements:
- update Electron window/app naming where appropriate
- update renderer titles, taglines, labels, and placeholders to reflect a legal co-working app
- avoid introducing legal claims or compliance promises in the UI copy
- keep the app booting and chatting exactly as before

Output:
- changed files list
- screenshots or textual UI verification notes
- brief note on future UI components that remain generic and should be addressed in later phases
```

---

# 33. Prompt for Phase 1: Add SQLite + Vault Initialization

```text
Task: Add the foundational local data layer for Equal Scales.

Goals:
- initialize a local Equal Scales vault on disk
- initialize a local SQLite database
- create first-pass schema for clients, matters, vault_files, conversations, messages, drafts, approvals, audit_events, retrieval_events
- do not yet migrate all UI flows to use the DB

Requirements:
- choose stable local paths for macOS
- create a backend storage module that owns path resolution and DB initialization
- keep filesystem and database responsibilities separate
- add safe startup checks and idempotent initialization
- do not store legal content only in the DB

Output:
- exact filesystem path strategy
- DB schema file(s)
- initialization service/module
- notes for future migration of localStorage chats into DB-backed conversations
```

---

# 34. Prompt for Phase 2: Matter/Client Architecture

```text
Task: Introduce matter-centric and client-centric objects into the application.

Goals:
- create client records
- create matter records under clients
- create canonical folder structures in the vault
- create canonical markdown files when a matter is created
- expose these objects in backend APIs
- begin adapting the UI from chat-first to matter-first

Requirements:
- matter creation must generate standardized Markdown files with YAML frontmatter
- folder names must be deterministic and safe
- each matter must have stable IDs independent from display names
- do not yet implement full document ingestion
- ensure conversations can be linked to a matter_id and client_id

Output:
- backend routes
- matter/client creation logic
- file templates
- UI changes for listing/selecting matters
```

---

# 35. Prompt for Phase 3: Markdown Canonicalization

```text
Task: Make Markdown vault files the canonical legal knowledge artifacts.

Goals:
- implement a parser/serializer for markdown files with frontmatter
- add a vault registry sync process into SQLite
- support reading, writing, and updating standard file types like matter.md, facts.md, issues.md, timeline.md, drafts, approvals, and conversations

Requirements:
- frontmatter schema must be enforced and validated
- preserve user edits where possible
- keep files readable and minimal
- avoid hidden metadata outside frontmatter/content unless app-level indexing requires it
- do not collapse distinct legal artifacts into one generic notes file

Output:
- parsing and validation module
- file writer utilities
- sync/indexing job
- tests covering frontmatter parsing and round-trip writes
```

---

# 36. Prompt for Phase 4: Retrieval Scope Enforcement

```text
Task: Implement retrieval orchestration and scope enforcement for Equal Scales.

Goals:
- support retrieval for current matter scope by default
- support current client scope as an explicit option
- support cross-matter-within-client search only when explicitly requested
- block unrestricted all-client search by default
- make active scope visible in the UI and available to the backend

Requirements:
- retrieval requests must log scope decisions in retrieval_events
- the backend must decide the allowed search space, not the model alone
- the UI must clearly show the current scope
- retrieval results must include source file metadata

Output:
- retrieval service
- scope enum/model
- UI scope selector or visible scope indicator
- audit/retrieval logging
```

---

# 37. Prompt for Phase 5: MemPalace Integration

```text
Task: Integrate MemPalace into Equal Scales as an assistive agent memory subsystem.

Goals:
- wire MemPalace into the backend as a memory adapter/service
- use it for long-horizon conversational recall and workflow continuity
- keep Markdown vault files as canonical legal knowledge artifacts
- enforce matter/client scope when querying or injecting memory

Requirements:
- MemPalace must not become the sole source of facts, approvals, or legal records
- memory retrieval should complement, not replace, source-grounded vault retrieval
- memory usage should be explainable in code structure even if not fully exposed in the UI yet
- avoid unrestricted global recall across all clients by default

Output:
- MemPalace adapter/service
- config strategy
- scoped retrieval integration points
- fallback behavior if MemPalace is unavailable
- explicit documentation of what data flows into memory vs vault vs SQLite
```

---

# 38. Prompt for Phase 6: Drafts, Sources, and Approval Workflow

```text
Task: Build legal drafting and review workflow primitives.

Goals:
- support draft generation tied to a matter
- show source references used in generation
- create draft files in the vault
- create approval records in Markdown and SQLite
- require explicit approval states before finalization

Requirements:
- drafts should have type, version, status, and derivation metadata
- approvals should be append-only or otherwise auditable
- generated content should maintain source traceability where feasible
- the UI should communicate draft status clearly

Output:
- draft generation route/service
- source reference model/display
- approval workflow routes and storage
- UI components for draft status and review
```

---

# 39. Prompt for Refactoring the Existing UI

```text
Task: Refactor the current chat-centric Electron UI into a matter-centric legal workspace.

Goals:
- preserve existing streaming behavior
- reduce model/provider experimentation UI prominence
- introduce matter/workspace navigation
- create panels for documents, facts/timeline, drafts, and sources

Requirements:
- do not break current working backend chat loop during refactor
- prefer incremental UI adaptation over a total rewrite
- keep the user aware of current client, matter, and retrieval scope
- maintain local-first behavior

Output:
- updated renderer layout
- navigation strategy
- list of legacy chat-first components still needing replacement
```

---

# 40. Guardrails for All Coding Agents

Every coding agent working on Equal Scales must follow these rules:

1. Do not implement unrestricted cross-client retrieval by default.
2. Do not store all legal truth only in agent memory.
3. Do not replace Markdown files with DB-only storage for canonical legal artifacts.
4. Do not add “magic” memory behavior that cannot be inspected.
5. Do not hide retrieval scope from the user.
6. Do not introduce client-facing finalization without approval states.
7. Do not optimize for cleverness over transparency.
8. Prefer deterministic file/folder schemas.
9. Preserve local-first data ownership.
10. When in doubt, prefer legal safety boundaries over convenience.

---

# 41. Questions to Resolve Before Full Build-Out

These questions should be answered during implementation planning:

1. Should conversation transcripts be stored verbatim in the vault, or summarized plus raw in DB?
2. Which legal artifacts should be generated as separate Markdown files vs sections in canonical files?
3. Will document OCR and chunking live in the app backend or a separate local service?
4. How should permissions work in single-user MVP vs future multi-user versions?
5. Should approvals be file-based only, DB-based only, or both? (Current recommendation: both.)
6. What minimum source citation granularity is required in the MVP?
7. Should MemPalace store only conversations, or also selected system-level workflow notes?

---

# 42. Near-Term Decision Summary

Decisions already made in this architecture:

- Use Open Claude Cowork as the shell/base.
- Use MemPalace as assistive memory, not the legal record.
- Store client/matter knowledge in Markdown files locally.
- Use SQLite for metadata/workflow/audit/index state.
- Default retrieval to current matter scope.
- Allow broader scope only explicitly.
- Build Equal Scales as a matter-centered legal workspace, not a generic AI chat app.

---

# 43. Final Recommendation

Proceed with this architecture.

It is stronger than:
- a pure generic chat wrapper
- a DB-only hidden legal app
- a memory-only agent product
- a Markdown-only uncontrolled notes vault

Because it balances:
- transparent local records
- structured workflow state
- strong agent continuity
- matter-safe retrieval boundaries
- long-term product extensibility

This architecture should be the basis for the next implementation plan and coding agent execution work.

---

# 44. Immediate Next Action

The next practical step after this document is:

Create and execute a task-by-task implementation plan for:
1. rebranding Open Claude Cowork into Equal Scales
2. adding SQLite + vault initialization
3. introducing clients and matters as first-class entities
4. creating canonical Markdown matter files
5. adapting the UI from chat-first to matter-first

That plan should follow this architecture exactly.

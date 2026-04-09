# Equal Scales Domain Model

> For coding agents: this document defines the main product entities and their intended relationships. Use this before inventing storage schemas, API contracts, or UI state models for Equal Scales.

## 1. Purpose

Equal Scales is not a generic chat app.
That means the data model must not be built around chats alone.

This document exists to define the first-class objects the product revolves around, especially for legal workflows.

---

## 2. Domain model principles

1. Matter is the core working context.
2. Client contains one or more matters.
3. Most retrieval and document actions should be scoped to a matter by default.
4. Documents, drafts, reviews, and source materials should not float around as unscoped assets.
5. Chat sessions exist, but they should attach to legal workspace context over time.
6. Agent actions should be represented as durable application events where they materially change state.

---

## 3. Core entities

## 3.1 Client

Represents the top-level legal relationship or organization/person being served.

Suggested fields:
- `id`
- `name`
- `display_name`
- `status`
- `description`
- `contact_metadata`
- `created_at`
- `updated_at`

Relationships:
- one client has many matters
- one client may have many contacts
- one client may have many templates associated by preference or default package

---

## 3.2 Matter

Represents the primary working unit for legal work.

Suggested fields:
- `id`
- `client_id`
- `name`
- `matter_number`
- `matter_type`
- `status`
- `jurisdiction`
- `summary`
- `opened_at`
- `closed_at`
- `created_at`
- `updated_at`

Relationships:
- belongs to one client
- has many documents/drafts
- has many conversations
- has many source materials
- has many review items
- may have many tags, deadlines, tasks, or timeline items later

Important rule:
- matter should be the default scope boundary for retrieval and assistant actions

---

## 3.3 Template

Represents a reusable drafting asset.

Examples:
- engagement letter
- complaint
- demand letter
- will template
- motion template

Suggested fields:
- `id`
- `name`
- `template_type`
- `storage_path`
- `source_format`
- `description`
- `tags`
- `jurisdiction`
- `practice_area`
- `created_at`
- `updated_at`

Relationships:
- may be used to generate many drafts
- may be suggested for many matters

Important rule:
- template is not the same as a draft or live document

---

## 3.4 Draft

Represents a working legal artifact created from a template, imported file, or prior version.

Suggested fields:
- `id`
- `matter_id`
- `template_id` nullable
- `title`
- `status`
- `storage_path` or structured content reference
- `document_type`
- `created_by`
- `created_at`
- `updated_at`

Relationships:
- belongs to one matter
- may originate from one template
- may later graduate into a richer document/review object model
- may have many versions

Important rule:
- a draft is matter-scoped, never free-floating by default

---

## 3.5 Document

Represents the structured editor-backed live document object when the richer document system is in use.

Suggested fields:
- `id`
- `matter_id`
- `draft_id` nullable
- `title`
- `status`
- `latest_snapshot_id`
- `created_at`
- `updated_at`

Relationships:
- belongs to one matter
- may derive from one draft
- has many snapshots/versions
- has many comments
- has many suggestions
- has many agent actions

Important rule:
- live document state should be structured editor JSON / collaborative state, not raw HTML or DOCX as the canonical source of truth

---

## 3.6 Document Snapshot / Version

Represents a durable saved state of a document.

Suggested fields:
- `id`
- `document_id`
- `version_number`
- `snapshot_json`
- `created_by`
- `created_at`
- `reason`

Relationships:
- belongs to one document
- supports comparison, rollback, review, and exports

---

## 3.7 Comment

Represents a review comment anchored to document content.

Suggested fields:
- `id`
- `document_id`
- `anchor_from`
- `anchor_to`
- `body`
- `status`
- `created_by`
- `resolved_by`
- `created_at`
- `resolved_at`

Relationships:
- belongs to one document
- may later be grouped into review threads

---

## 3.8 Suggestion / Review Change

Represents a proposed edit or structured review change.

Suggested fields:
- `id`
- `document_id`
- `anchor_from`
- `anchor_to`
- `replacement_payload`
- `rationale`
- `status`
- `created_by`
- `created_at`
- `resolved_at`

Relationships:
- belongs to one document
- may be created by a human or the agent

---

## 3.9 Source Material

Represents supporting material used in a matter.

Examples:
- uploaded PDFs
- prior contracts
- exhibits
- correspondence
- notes
- authority/research references

Suggested fields:
- `id`
- `matter_id`
- `title`
- `material_type`
- `storage_path`
- `mime_type`
- `summary`
- `created_at`
- `updated_at`

Relationships:
- belongs to one matter
- may be referenced by documents, chats, or agent actions

---

## 3.10 Conversation

Represents a chat session between the user and the assistant.

Suggested fields:
- `id`
- `client_id` nullable
- `matter_id` nullable
- `title`
- `status`
- `created_at`
- `updated_at`

Relationships:
- may belong to a matter
- has many messages
- may produce drafts, research items, or document actions

Important rule:
- conversation should eventually become a workspace-aware object, not only a generic chat transcript

---

## 3.11 Message

Represents an individual entry in a conversation.

Suggested fields:
- `id`
- `conversation_id`
- `role`
- `content`
- `tool_metadata`
- `created_at`

Relationships:
- belongs to one conversation

---

## 3.12 Agent Action

Represents a material action taken by the assistant that changes state or triggers workflow.

Examples:
- created draft from template
- inserted clause
- rewrote selection
- created comment
- exported document
- navigated user to a review pane if navigation actions are logged

Suggested fields:
- `id`
- `actor_type`
- `actor_id`
- `matter_id` nullable
- `document_id` nullable
- `conversation_id` nullable
- `action_type`
- `payload_json`
- `created_at`

Important rule:
- log important state-changing actions durably

---

## 4. Core relationships summary

At a high level:
- client -> many matters
- matter -> many drafts
- matter -> many documents
- matter -> many source materials
- matter -> many conversations
- template -> many drafts
- draft -> may become or back one document
- document -> many snapshots
- document -> many comments
- document -> many suggestions
- document -> many agent actions
- conversation -> many messages

---

## 5. Scope rules

Default scope rules should be:
- current matter first
- then current client if broadened
- then cross-matter or global only when explicitly requested

This should affect:
- retrieval
- suggestions
- document actions
- draft generation
- template recommendations
- source lookup

---

## 6. Storage and architecture implications

This domain model implies:
- avoid building the app around `allChats` as the primary source of structure
- move toward first-class client and matter repositories
- keep drafts/documents associated with matters
- store review objects separately from raw editor content where appropriate
- distinguish conversation history from durable legal workspace state

---

## 7. Common mistakes to avoid

- treating chats as the main organizing model forever
- storing important legal workflow state only in localStorage
- making document imports or exports the canonical source of truth
- mixing review metadata directly into unqueryable blobs
- weakening matter scoping for convenience

---

## 8. Canonical use of this document

Use this domain model whenever you are:
- designing DB tables
- designing API responses
- designing front-end state shapes
- building repositories
- deciding where a new concept belongs in the product

If a new concept does not fit naturally, it probably means the architecture needs clarification before implementation.

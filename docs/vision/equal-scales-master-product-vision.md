# Equal Scales Master Product Vision

> For coding agents, designers, and future collaborators: this is the canonical product vision document for Equal Scales. Read this first if you need to understand what the product is trying to become before making architectural or implementation decisions.

## 1. Product identity

Equal Scales is a matter-centered legal co-working and legal assistant platform.

It is not:
- a generic AI chat app
- a generic document editor
- a generic note-taking app
- a workflow app with AI pasted on the side

It is:
- a legal workspace built around clients and matters
- a chat-centered application where the assistant is the main control surface
- a drafting, review, research, and matter-organization system
- a local-first and inspectable environment for legal work

The product should feel like a trusted legal coworker that helps an attorney move through work without losing context, scope, or auditability.

---

## 2. Who the product is for

Primary users:
- solo attorneys
- small law firms
- legal teams that need matter-scoped drafting and review
- attorneys who want AI assistance without giving up structure, control, or inspectability

Secondary users later:
- paralegals
- legal assistants
- internal legal ops
- client-facing collaborators under controlled permissions

These users care about:
- speed
- trustworthy drafting support
- matter-scoped context
- reviewability
- provenance
- auditability
- local control over documents and knowledge

---

## 3. Core product promise

Equal Scales should let a lawyer stay in one assistant-led environment while the system helps them:
- navigate to the right client or matter
- retrieve the right scoped context
- generate or revise the right draft
- review edits safely
- move between templates, drafts, research, and review without hunting around the UI

The key promise is not “AI can write.”
The key promise is:

“AI can help attorneys move through legal work in the right context, with the right controls, in a workspace built for legal workflows.”

---

## 4. The core product philosophy

### 4.1 Matter-centered by default

Everything important should be anchored to the correct client and matter.

That includes:
- retrieval
- documents
- drafts
- templates selected for a matter
- review context
- research results
- approvals
- agent actions

Broader scope should be possible, but only when explicitly requested.

### 4.2 Chat is the primary control surface

The assistant is not just a chatbot beside the app.
The assistant should be able to drive the product.

Examples:
- “Open the Smith matter.”
- “Show me the latest demand letter draft.”
- “Use the litigation hold template for this client.”
- “Take me to review mode.”
- “Compare this draft to the previous version.”

This means the chat must be integrated into navigation, action dispatch, and workspace transitions.

### 4.3 The app should be local-first and inspectable

Legal users need trust.
The system should preserve:
- human-readable records where practical
- inspectable storage
- clear ownership of templates and drafts
- recoverability
- low dependence on opaque cloud-only state

### 4.4 AI actions must be structured and reviewable

AI should not make invisible, mysterious edits.
Important actions should be:
- scoped
- logged
- reversible
- attributable
- reviewable by humans

### 4.5 Equal Scales should feel familiar, but not trapped by legacy software

The product should borrow the trust and familiarity of Word- and Docs-like workflows where needed, but it should not blindly copy old software categories.

The goal is not “build Microsoft Word.”
The goal is “build a legal drafting and review workspace that feels trustworthy to attorneys.”

---

## 5. The core entities of the product

Equal Scales revolves around a few first-class objects.

### Clients
Top-level legal relationship containers.

### Matters
The main working unit of the product.
Most retrieval, drafting, and review should happen inside a matter scope.

### Templates
Reusable legal drafting assets.
Examples:
- letters
- contracts
- motions
- intake forms
- checklists

### Drafts / Documents
Working outputs derived from templates, prior drafts, or imports.

### Research / Source materials
Facts, notes, authorities, uploaded exhibits, PDFs, external references, and related support materials.

### Reviews
Comments, suggestions, version comparisons, approvals, and issue tracking around a document.

### Agent actions
Structured actions the assistant takes in the workspace.

---

## 6. The ideal user journey

A strong Equal Scales workflow should look like this:

1. The user enters the app and stays in a conversational workspace.
2. The user opens or creates a client.
3. The user opens or creates a matter.
4. The assistant automatically scopes retrieval and actions to that matter.
5. The user asks for a template, prior draft, or research task.
6. The assistant opens the correct workspace and prepares the right artifact.
7. The assistant drafts, revises, or annotates using scoped context.
8. The user reviews edits, comments, suggestions, and source support.
9. The draft is versioned, stored, and later exported or finalized.

The key UX idea is continuity.
The user should not feel like they are bouncing between disconnected tools.

---

## 7. Product phases and sequencing logic

Equal Scales should not try to build everything at once.

### Near-term emphasis
Template-first legal drafting workflow:
- clients
- matters
- local template library
- draft generation
- chat-driven navigation
- inspectable storage

### Next emphasis
Document workspace foundation:
- structured editor
- collaboration
- document persistence
- comments and review scaffolding

### Later emphasis
Word-grade legal review and polish:
- suggestions / redlines
- comments and review panes
- legal numbering stability
- clause handling
- PDF review
- DOCX import/export improvements

### Long-term differentiation
Agent-native legal workbench:
- source-backed edits
- matter-scoped multi-step workflows
- review orchestration
- legal knowledge memory
- controlled automation across the full matter lifecycle

---

## 8. What the MVP should prove

The MVP does not need to prove everything.
It should prove:
- the matter-centered model is correct
- template-first drafting creates real value
- chat-driven navigation is better than a generic legal dashboard
- local-first storage and inspectability are useful
- the system can evolve into a rich document and review platform without architectural rewrites

---

## 9. What makes Equal Scales different

Equal Scales should differentiate on the combination of:
- legal workflow specificity
- chat-centered orchestration
- matter-scoped retrieval safety
- structured and reviewable AI actions
- local-first inspectability
- eventually strong drafting and review ergonomics

A generic AI app can answer questions.
Equal Scales should help a lawyer move work forward inside the right matter context.

---

## 10. Non-goals and anti-patterns

Equal Scales should not become:
- a general productivity workspace for everyone
- a generic AI wrapper with vague legal branding
- a system where the AI edits legal documents invisibly
- a product that treats client and matter boundaries loosely
- a product where core architecture decisions live only in chat transcripts

---

## 11. Implications for coding agents

If you are a coding agent, this vision means:
- preserve matter-scoped access and retrieval boundaries
- preserve the assistant-first UX
- favor structured domain objects over ad hoc chat state
- favor inspectable storage and durable architecture
- do not optimize for generic note-taking or generic chat features at the expense of legal workflows
- treat templates, drafts, matters, and reviews as first-class concepts

---

## 12. Canonical interpretation rule

If implementation questions arise, interpret the product in this order:
1. matter-centered legal workspace
2. assistant as primary control surface
3. local-first inspectability
4. structured reviewable AI actions
5. permissive-license and modular architecture discipline

If a proposed feature conflicts with those principles, it should be reconsidered or deferred.

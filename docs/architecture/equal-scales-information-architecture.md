# Equal Scales Information Architecture and Navigation Model

> For coding agents and designers: this document defines how the main application surfaces should relate to each other. Use this before inventing new navigation patterns or UI areas that conflict with the chat-centered workspace model.

## 1. Purpose

Equal Scales is chat-centered, but it is not chat-only.
The information architecture must let the assistant remain the main control surface while the rest of the app reshapes around the current legal task.

This document explains:
- the main workspace surfaces
- how the user moves between them
- how the assistant should control navigation
- what should feel primary vs secondary in the UI

---

## 2. IA principles

1. Chat is the primary anchor surface.
2. Clients and matters are the primary domain navigation surfaces.
3. Templates, drafts, documents, research, and review are task surfaces beneath client/matter context.
4. The assistant should be able to navigate the user into any of those surfaces.
5. The UI should preserve context rather than feeling like separate apps stapled together.

---

## 3. Top-level workspace surfaces

Equal Scales should eventually support these primary surfaces:

### 3.1 Chat workspace
Purpose:
- primary conversational control surface
- user asks for actions, navigation, drafting, and review assistance
- assistant summarizes context and suggests next actions

### 3.2 Client workspace
Purpose:
- top-level legal account view
- all matters and key context for a client

### 3.3 Matter workspace
Purpose:
- the main working surface for a legal matter
- should aggregate drafts, documents, research, notes, timelines, and review entry points

### 3.4 Template workspace
Purpose:
- browse, inspect, and select reusable legal templates
- create drafts from templates

### 3.5 Draft / document workspace
Purpose:
- edit structured legal content
- later support collaboration, comments, suggestions, and review

### 3.6 Research / source workspace
Purpose:
- inspect source materials, uploaded files, notes, authorities, and support context

### 3.7 Review workspace
Purpose:
- comments
- suggestions/redlines
- version compare
- issue resolution

---

## 4. Primary navigation hierarchy

The cleanest hierarchy should be:

- Home / chat anchor
  - Clients
    - Matters
      - Templates
      - Drafts
      - Documents
      - Research / sources
      - Review

This does not mean the user must always click through this tree manually.
It means this is the underlying product structure the assistant and UI should respect.

---

## 5. The role of chat in navigation

Chat should be able to drive:
- opening a client
- switching to a matter
- opening a template picker
- opening a draft
- opening review mode
- opening a source PDF or research view
- narrowing or broadening retrieval scope

Examples:
- “Take me to the Jones matter.”
- “Open the latest settlement draft.”
- “Show me sources for this paragraph.”
- “Switch to review mode.”

This means the frontend should expose structured navigation actions, not just links.

---

## 6. Recommended workspace shell model

The product should use one persistent shell with changing panes, rather than hard-switching between unrelated applications.

A useful mental model:

### Persistent shell areas
- left navigation / matter context rail
- main center workspace
- assistant/chat panel or assistant-centered main layout
- right detail/review/context panel

Depending on task, the center and right areas change.

Examples:

#### In drafting mode
- center: document canvas
- right: comments / outline / AI actions

#### In research mode
- center: source viewer or research list
- right: extracted notes / linked matter context

#### In matter overview mode
- center: matter dashboard / recent artifacts
- right: assistant suggestions / next steps

The user should feel like they remain inside one coherent matter workspace.

---

## 7. Surface-specific navigation rules

## 7.1 Client workspace
Should show:
- client summary
- list of matters
- templates or preferred workflows associated with that client
- recent drafts/documents

Should not become:
- a dumping ground for every file without structure

## 7.2 Matter workspace
Should become the most important non-chat screen in the product.

Should show:
- matter summary
- recent documents/drafts
- related source materials
- pending review items
- quick actions
- assistant-relevant context

## 7.3 Template workspace
Should support:
- filtering by matter type, practice area, or jurisdiction
- selecting templates for a matter
- seeing what variables/sections a template expects

## 7.4 Document workspace
Should support:
- editing
- save status
- collaboration status later
- access to review and source support

## 7.5 Review workspace
Should support:
- comments
- suggestions
- compare/version view
- approval or resolution flows

---

## 8. Information architecture implications for coding agents

If you are implementing UI or navigation:
- do not build isolated mini-apps that break the overall workspace continuity
- do not make the document editor feel disconnected from the matter context
- do not require the user to manually re-establish scope repeatedly
- do not make chat secondary if the feature should be assistant-driven

Instead:
- preserve context in the shell
- keep visible matter/client indicators
- expose structured navigation and workspace actions
- keep the assistant aware of the active workspace

---

## 9. Suggested view-state model

A useful future state shape might include:
- `activeClientId`
- `activeMatterId`
- `activeWorkspaceType`
- `activeArtifactId`
- `activeReviewPanel`
- `retrievalScope`

Where `activeWorkspaceType` might be one of:
- `chat`
- `client`
- `matter`
- `template-library`
- `draft`
- `document`
- `research`
- `review`

The exact names can differ, but the structure should remain explicit.

---

## 10. UX anti-patterns to avoid

- making the app just a chat pane plus random modal dialogs
- making matter context invisible while editing documents
- treating document review as detached from the document workspace
- putting all navigation burden on left-sidebar clicks only
- allowing assistant actions without visible scope/context cues

---

## 11. Canonical navigation rule

The assistant should be able to move the user through the app by invoking structured navigation actions that preserve client/matter context.

That is one of the core product ideas.
If a feature undermines that principle, it likely does not fit the intended Equal Scales UX.

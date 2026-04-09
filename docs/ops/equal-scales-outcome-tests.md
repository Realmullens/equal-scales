# Equal Scales Outcome Tests

> These are product-facing acceptance scenarios for Equal Scales. They are the main outcome tests agents should use to understand whether work is actually moving the product forward.

## How to use this file

If you are an agent:
- pick the scenarios relevant to the current milestone
- convert them into the appropriate verification mix: unit, integration, smoke, or manual UI review
- do not claim milestone completion unless the relevant scenarios pass

---

## Test group A — matter-centered workspace foundation

### OUTCOME-A1 — Create a client
Given the app is running
When the user creates a client
Then the client should be stored durably
And the client should be visible in the legal workspace model
And the client should be available for later matter association

### OUTCOME-A2 — Create a matter under a client
Given a client exists
When the user creates a matter under that client
Then the matter should be durably stored
And it should remain associated with the correct client
And the assistant should be able to reference that matter as a first-class object

### OUTCOME-A3 — Matter becomes the active scope
Given the user opens a matter
When the matter is active
Then retrieval and document actions should default to that matter unless explicitly broadened

---

## Test group B — template-first legal drafting MVP

### OUTCOME-B1 — Browse templates
Given templates exist in the local template library
When the user or assistant opens the template workspace
Then the app should show the available templates with enough metadata to choose one

### OUTCOME-B2 — Generate a draft from a template
Given a matter is active and a template is selected
When the user asks the assistant to generate a draft
Then a new matter-scoped draft should be created
And the draft should preserve its template origin metadata if applicable

### OUTCOME-B3 — Draft uses scoped matter context
Given a matter is active
When the assistant fills a draft from a template
Then the assistant should rely on the active matter/client context by default
And should not pull unrelated matter information unless explicitly directed

### OUTCOME-B4 — Save and reopen draft
Given a draft has been generated or edited
When the user reopens it later
Then the latest durable saved state should be available

---

## Test group C — document workspace foundation

### OUTCOME-C1 — Open document workspace
Given a document exists
When the user opens the document workspace
Then the document workspace should render without fatal errors
And the active matter context should remain visible or inferable

### OUTCOME-C2 — Structured editing works
Given the document workspace is open
When the user types and formats text
Then the content should be stored as structured editor state, not only loose HTML

### OUTCOME-C3 — Save and reload structured document
Given the user edits a document
When the document is saved and reopened
Then the content should round-trip accurately
And the document should remain associated with the correct matter

### OUTCOME-C4 — Agent can target document actions structurally
Given the document workspace is open
When the assistant performs a document action
Then the action should be represented as a structured command or transaction, not brittle DOM automation

---

## Test group D — collaboration foundation

### OUTCOME-D1 — Two sessions open the same document
Given two sessions are authorized for the same matter/document
When both open the same live document
Then both should connect to the same collaborative state

### OUTCOME-D2 — Real-time updates propagate
Given two sessions are on the same document
When one user edits the document
Then the other should see the update appear without a manual reload

### OUTCOME-D3 — Unauthorized document collaboration is rejected
Given a user lacks access to a matter/document
When that user attempts to connect to the collaborative document
Then access should be denied

### OUTCOME-D4 — Shared state survives reconnect
Given collaborative edits have been made
When one session disconnects and later reconnects
Then the saved collaborative state should restore correctly

---

## Test group E — review and trust foundation

### OUTCOME-E1 — Comments are matter/document scoped
Given a comment exists on a document
When the document is reopened later
Then the comment should remain anchored to the correct document and matter

### OUTCOME-E2 — Suggestions are reviewable
Given a suggestion has been created by a human or agent
When the user enters review mode
Then the suggestion should be visible, attributable, and actionable

### OUTCOME-E3 — Important AI edits are logged
Given the assistant performs a meaningful document mutation
When the action completes
Then the system should store a durable record of what changed and in what context

---

## Test group F — assistant-led navigation

### OUTCOME-F1 — Open a matter from chat
Given multiple matters exist
When the user says “open the Smith matter”
Then the assistant should navigate to the correct matter workspace

### OUTCOME-F2 — Open a draft from chat
Given multiple drafts exist in a matter
When the user asks for the latest demand letter draft
Then the assistant should navigate to the correct draft or document workspace

### OUTCOME-F3 — Switch to review mode from chat
Given a document is active
When the user asks to switch to review mode
Then the UI should move into the appropriate review-oriented surface or panel arrangement

---

## Test group G — access control and scope safety

### OUTCOME-G1 — Wrong-matter document access is rejected
Given a user is viewing matter A
When the user or agent tries to access a document from matter B without authorization or explicit scope change
Then the system should reject or prevent the action

### OUTCOME-G2 — Retrieval stays in scope by default
Given a matter is active
When the assistant answers a drafting or review request
Then retrieval should remain in the active matter scope unless explicitly broadened

### OUTCOME-G3 — Scope broadening is explicit
Given the user wants cross-matter or broader retrieval
When they request it
Then the system should record that broader scope intentionally rather than silently expanding it

---

## Suggested mapping from outcome tests to implementation phases

### Earliest workspace phases
- A1, A2, A3
- B1, B2, B3, B4

### Document foundation phases
- C1, C2, C3, C4

### Collaboration phases
- D1, D2, D3, D4

### Review phases
- E1, E2, E3

### Navigation and safety phases
- F1, F2, F3
- G1, G2, G3

---

## Rule for agents

Do not say “the feature is done” unless you can point to the relevant outcome tests and show how they were verified.

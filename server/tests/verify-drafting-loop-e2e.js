/**
 * Equal Scales — Milestone 2 Slice 01 Verification
 * End-to-End Template-First Drafting Loop
 *
 * Verifies OUTCOME-B1 through B4:
 * - B1: Browse templates (list with metadata)
 * - B2: Generate draft from template (matter-scoped, preserves origin)
 * - B3: Draft uses scoped matter context (context assembly)
 * - B4: Save and reopen draft (persistence)
 *
 * Usage: cd server && node tests/verify-drafting-loop-e2e.js
 */

import { initDatabase, getDb, closeDatabase } from '../storage/db.js';
import { createClient, updateClient } from '../storage/repositories/clients.js';
import { createMatter, updateMatter } from '../storage/repositories/matters.js';
import { createTemplate, getTemplateById, listTemplates } from '../storage/repositories/templates.js';
import { createDraft, getDraftById, listDraftsByClient, listDraftVersions } from '../storage/repositories/drafts.js';
import { gatherContext, formatContextForPrompt } from '../services/context-service.js';
import { buildDraftingPrompt, saveDraft } from '../services/draft-service.js';
import { createClientVault, createMatterVault } from '../services/vault-service.js';
import { syncTemplates, getTemplateWithBody } from '../services/template-service.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  PASS  ${label}`); passed++; }
  else { console.error(`  FAIL  ${label}`); failed++; }
}

function section(title) { console.log(`\n--- ${title} ---`); }

// Initialize
initDatabase();
const db = getDb();

// Clean test data
db.prepare("DELETE FROM messages").run();
db.prepare("DELETE FROM conversations").run();
db.prepare("DELETE FROM source_documents").run();
db.prepare("DELETE FROM documents").run();
db.prepare("DELETE FROM drafts").run();
db.prepare("DELETE FROM matters").run();
db.prepare("DELETE FROM clients").run();

// Sync templates from disk
syncTemplates();

// ==============================
// OUTCOME-B1: Browse templates
// ==============================
section('OUTCOME-B1: Browse templates');

const allTemplates = listTemplates();
assert(allTemplates.length >= 5, `Template library has ${allTemplates.length} templates (expected >= 5)`);

// Verify templates have required metadata
for (const tmpl of allTemplates) {
  assert(tmpl.name && tmpl.name.length > 0, `Template "${tmpl.slug}" has a name`);
  assert(tmpl.template_type, `Template "${tmpl.slug}" has a type`);
  assert(tmpl.source_path, `Template "${tmpl.slug}" has a source path`);
  assert(fs.existsSync(tmpl.source_path), `Template "${tmpl.slug}" source file exists on disk`);
}

// Verify type filtering works
const estateTemplates = listTemplates({ templateType: 'estate' });
assert(estateTemplates.length >= 1, 'Estate templates filterable');

const litigationTemplates = listTemplates({ templateType: 'litigation' });
assert(litigationTemplates.length >= 1, 'Litigation templates filterable');

// Verify template body is retrievable
const willTemplate = allTemplates.find(t => t.slug === 'simple-will');
assert(willTemplate !== null, 'Simple Will template exists');

const withBody = getTemplateWithBody(willTemplate.id);
assert(withBody !== null, 'Template with body retrievable');
assert(withBody.body && withBody.body.length > 100, 'Template body has substantial content');
assert(withBody.body.includes('{{client_full_name}}'), 'Template body contains placeholders');

// ==============================
// SETUP: Create test client + matter with vault
// ==============================
section('Setup: Client and matter with vault');

const client = createClient({ name: 'Drafting Test Corp', displayName: 'Drafting Test Corp' });
const clientVault = createClientVault(client);
updateClient(client.id, { root_path: clientVault });
client.root_path = clientVault;
assert(clientVault !== null, 'Client vault created');

const matter = createMatter({ clientId: client.id, name: 'Estate of John Smith', matterType: 'estate' });
const matterVault = createMatterVault(client, matter);
updateMatter(matter.id, { matter_path: matterVault });
matter.matter_path = matterVault;
assert(matterVault !== null, 'Matter vault created');

// Enrich matter context files with test data
const matterMdPath = path.join(matterVault, 'matter.md');
fs.writeFileSync(matterMdPath, `# Estate of John Smith

## Matter Details
- **Client:** Drafting Test Corp
- **Type:** Estate
- **Status:** active

## Summary
John Smith (DOB: 1955-03-15) wishes to create a simple will.
He resides at 123 Oak Street, Springfield, IL 62704.

## Key Facts
- Spouse: Jane Smith
- Children: Alice Smith, Robert Smith
- Executor: Jane Smith
- Alternate Executor: Alice Smith
`, 'utf-8');

const factsMdPath = path.join(matterVault, 'facts.md');
fs.writeFileSync(factsMdPath, `# Facts — Estate of John Smith

## Key Facts
- John Smith is 71 years old
- He owns a home at 123 Oak Street, Springfield, IL 62704
- He has two adult children: Alice and Robert
- His spouse Jane is the intended executor
- Estate includes: primary residence, savings accounts, investment portfolio
- No prior will exists
`, 'utf-8');

// ==============================
// OUTCOME-B3: Draft uses scoped matter context
// ==============================
section('OUTCOME-B3: Draft uses scoped matter context');

const context = gatherContext({ clientId: client.id, matterId: matter.id });
assert(context.client !== null, 'Context includes client');
assert(context.matter !== null, 'Context includes matter');
assert(context.files.matter !== null, 'Context includes matter.md content');
assert(context.files.facts !== null, 'Context includes facts.md content');

const contextText = formatContextForPrompt(context);
assert(contextText.includes('Drafting Test Corp'), 'Context contains client name');
assert(contextText.includes('Estate of John Smith'), 'Context contains matter name');
assert(contextText.includes('123 Oak Street'), 'Context contains matter-specific facts');
assert(contextText.includes('Jane Smith'), 'Context contains spouse name from facts');

// Verify context is matter-scoped (doesn't include other matters)
assert(!contextText.includes('unrelated'), 'Context does not contain unrelated data');

// ==============================
// OUTCOME-B2: Generate draft from template
// ==============================
section('OUTCOME-B2: Generate draft from template (prompt assembly)');

const { prompt, template, context: draftContext } = buildDraftingPrompt({
  templateId: willTemplate.id,
  clientId: client.id,
  matterId: matter.id,
  instructions: 'Please focus on the beneficiary section.'
});

assert(prompt.length > 500, 'Drafting prompt has substantial length');
assert(prompt.includes('Simple Will'), 'Prompt includes template name');
assert(prompt.includes('Drafting Test Corp'), 'Prompt includes client name');
assert(prompt.includes('Estate of John Smith'), 'Prompt includes matter name');
assert(prompt.includes('matter'), 'Prompt includes scope level');
assert(prompt.includes('{{client_full_name}}'), 'Prompt includes template placeholders');
assert(prompt.includes('beneficiary section'), 'Prompt includes user instructions');
assert(prompt.includes('REVIEW REQUIRED'), 'Prompt mentions REVIEW REQUIRED convention');
assert(prompt.includes('123 Oak Street'), 'Prompt includes matter context data');
assert(template.id === willTemplate.id, 'Returned template matches requested');

// ==============================
// OUTCOME-B4: Save and reopen draft
// ==============================
section('OUTCOME-B4: Save and reopen draft');

// Simulate agent output (what the agent would return after filling the template)
const filledContent = `# Last Will and Testament of John Smith

I, **John Smith**, of 123 Oak Street, Springfield, IL 62704, being of sound mind and memory, do hereby declare this to be my Last Will and Testament.

## Article I — Identification
I am John Smith, residing at 123 Oak Street, Springfield, IL 62704.

## Article II — Appointment of Executor
I appoint **Jane Smith**, of 123 Oak Street, Springfield, IL 62704, as the Executor of this Will.
If Jane Smith is unable or unwilling to serve, I appoint **Alice Smith** as alternate Executor.

## Article III — Debts and Expenses
I direct my Executor to pay all legally enforceable debts, funeral expenses, and costs of administration from my estate.

## Article IV — Specific Bequests
- To my daughter Alice Smith: my collection of first-edition books
- To my son Robert Smith: my 1967 vintage automobile

## Article V — Residuary Estate
I give the rest, residue, and remainder of my estate to my spouse, Jane Smith.
If Jane Smith predeceases me, the residuary estate shall be divided equally between Alice Smith and Robert Smith.

## Article VI — General Provisions
If any beneficiary predeceases me, their share shall pass to their surviving descendants per stirpes.
My Executor shall have full power to sell, lease, or otherwise manage estate property as necessary.
`;

// Save the draft
const savedDraft = saveDraft({
  content: filledContent,
  templateId: willTemplate.id,
  clientId: client.id,
  matterId: matter.id,
  title: 'Simple Will'
});

assert(savedDraft !== null, 'Draft saved successfully');
assert(savedDraft.id.startsWith('draft_'), 'Draft has valid ID');
assert(savedDraft.client_id === client.id, 'Draft belongs to correct client');
assert(savedDraft.matter_id === matter.id, 'Draft belongs to correct matter');
assert(savedDraft.template_id === willTemplate.id, 'Draft preserves template origin');
assert(savedDraft.version === 1, 'Draft is version 1');
assert(savedDraft.status === 'draft', 'Draft status is draft');
assert(savedDraft.file_path.endsWith('.md'), 'Draft file is markdown');

// Verify file exists on disk
assert(fs.existsSync(savedDraft.file_path), 'Draft file exists on disk');
const savedContent = fs.readFileSync(savedDraft.file_path, 'utf-8');
assert(savedContent.includes('John Smith'), 'Saved file contains filled content');
assert(savedContent.includes('Jane Smith'), 'Saved file contains executor name');

// Reopen draft (simulates user reopening later)
const reopened = getDraftById(savedDraft.id);
assert(reopened !== null, 'Draft retrievable by ID after save');
assert(reopened.title === 'Simple Will', 'Reopened draft has correct title');
assert(reopened.version === 1, 'Reopened draft has correct version');

// Read file content for reopened draft
const reopenedContent = fs.readFileSync(reopened.file_path, 'utf-8');
assert(reopenedContent === filledContent, 'Reopened file content matches original save');

// ==============================
// VERSION MANAGEMENT
// ==============================
section('Draft versioning');

// Save v2 (simulates revision)
const revisedContent = filledContent.replace(
  'my collection of first-edition books',
  'my collection of first-edition books and my grand piano'
);

const v2Draft = saveDraft({
  content: revisedContent,
  templateId: willTemplate.id,
  clientId: client.id,
  matterId: matter.id,
  title: 'Simple Will'
});

assert(v2Draft.version === 2, 'Revised draft is version 2');
assert(v2Draft.file_path !== savedDraft.file_path, 'V2 has different file path than v1');
assert(fs.existsSync(v2Draft.file_path), 'V2 file exists on disk');
assert(fs.existsSync(savedDraft.file_path), 'V1 file still exists (not overwritten)');

// List versions
const versions = listDraftVersions(client.id, 'Simple Will', { matterId: matter.id });
assert(versions.length === 2, 'Two versions listed');
assert(versions[0].version === 2, 'Latest version first');
assert(versions[1].version === 1, 'Original version second');

// List by matter
const matterDrafts = listDraftsByClient(client.id, { matterId: matter.id });
assert(matterDrafts.length >= 2, 'Both drafts listed under matter');

// ==============================
// CROSS-MATTER ISOLATION
// ==============================
section('Cross-matter draft isolation');

// Create second matter
const matter2 = createMatter({ clientId: client.id, name: 'Contract Review', matterType: 'contracts' });
const matter2Vault = createMatterVault(client, matter2);
updateMatter(matter2.id, { matter_path: matter2Vault });

// Create draft in second matter with same title
const otherMatterDraft = saveDraft({
  content: '# Demand Letter\n\nDraft content for different matter.',
  clientId: client.id,
  matterId: matter2.id,
  title: 'Simple Will'  // same title, different matter
});

assert(otherMatterDraft.version === 1, 'Same title in different matter starts at v1');

// Versions should not leak across matters
const m1Versions = listDraftVersions(client.id, 'Simple Will', { matterId: matter.id });
const m2Versions = listDraftVersions(client.id, 'Simple Will', { matterId: matter2.id });
assert(m1Versions.length === 2, 'Matter 1 still has 2 versions');
assert(m2Versions.length === 1, 'Matter 2 has 1 version (isolated)');

// ==============================
// CLEANUP
// ==============================
section('Cleanup');

// Remove test vault directories
if (clientVault && fs.existsSync(clientVault)) {
  fs.rmSync(clientVault, { recursive: true, force: true });
}

db.prepare("DELETE FROM source_documents").run();
db.prepare("DELETE FROM documents").run();
db.prepare("DELETE FROM drafts").run();
db.prepare("DELETE FROM matters").run();
db.prepare("DELETE FROM clients").run();

closeDatabase();

console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) {
  console.error('VERIFICATION FAILED');
  process.exit(1);
} else {
  console.log('ALL OUTCOME TESTS PASSED');
  process.exit(0);
}

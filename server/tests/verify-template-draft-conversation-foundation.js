/**
 * Equal Scales — Milestone 1 Slice 02 Verification
 * Template, Draft, and Conversation Foundation Hardening
 *
 * Usage: cd server && node tests/verify-template-draft-conversation-foundation.js
 */

import { initDatabase, getDb, closeDatabase } from '../storage/db.js';
import { createClient } from '../storage/repositories/clients.js';
import { createMatter } from '../storage/repositories/matters.js';
import { createTemplate, getTemplateById, getTemplateBySlug, listTemplates, updateTemplate } from '../storage/repositories/templates.js';
import { createDraft, getDraftById, listDraftsByClient, listDraftVersions, updateDraft } from '../storage/repositories/drafts.js';
import { createConversation, getConversationById, listConversations, updateConversation, addMessage, getMessages } from '../storage/repositories/conversations.js';

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
db.prepare("DELETE FROM templates").run();
db.prepare("DELETE FROM matters").run();
db.prepare("DELETE FROM clients").run();

// Create test fixtures
const clientA = createClient({ name: 'Slice02 Client A' });
const clientB = createClient({ name: 'Slice02 Client B' });
const matterA1 = createMatter({ clientId: clientA.id, name: 'Matter A1', matterType: 'estate' });
const matterA2 = createMatter({ clientId: clientA.id, name: 'Matter A2', matterType: 'litigation' });
const matterB1 = createMatter({ clientId: clientB.id, name: 'Matter B1', matterType: 'contracts' });

// ==============================
// TEMPLATES
// ==============================
section('Templates: CRUD');

const tmpl1 = createTemplate({
  slug: 'test-will',
  name: 'Test Will Template',
  templateType: 'estate',
  description: 'A test will template',
  sourcePath: '/test/templates/test-will.md',
  placeholders: ['client_name', 'executor_name'],
  tags: ['will', 'estate']
});
assert(tmpl1 !== null, 'Template created');
assert(tmpl1.id.startsWith('tmpl_'), 'Template ID has correct prefix');
assert(tmpl1.slug === 'test-will', 'Template slug correct');
assert(tmpl1.template_type === 'estate', 'Template type stored');
assert(JSON.parse(tmpl1.placeholders_json).length === 2, 'Placeholders stored as JSON');
assert(JSON.parse(tmpl1.tags_json).includes('will'), 'Tags stored as JSON');

// Get by ID
const fetchedTmpl = getTemplateById(tmpl1.id);
assert(fetchedTmpl !== null, 'Template retrievable by ID');
assert(fetchedTmpl.name === 'Test Will Template', 'Retrieved name matches');

// Get by slug
const bySlug = getTemplateBySlug('test-will');
assert(bySlug !== null, 'Template retrievable by slug');
assert(bySlug.id === tmpl1.id, 'Slug lookup returns correct template');

// Create second template
const tmpl2 = createTemplate({
  slug: 'test-demand',
  name: 'Test Demand Letter',
  templateType: 'litigation',
  sourcePath: '/test/templates/test-demand.md',
  placeholders: ['client_name'],
  tags: ['demand']
});

// List all
const allTemplates = listTemplates();
assert(allTemplates.length >= 2, 'List returns all templates');

// List by type
const estateTemplates = listTemplates({ templateType: 'estate' });
assert(estateTemplates.length >= 1, 'List by type filters correctly');
assert(estateTemplates.every(t => t.template_type === 'estate'), 'All results match type filter');

const litigationTemplates = listTemplates({ templateType: 'litigation' });
assert(litigationTemplates.length >= 1, 'Litigation type filter works');

// Update
const updatedTmpl = updateTemplate(tmpl1.id, {
  description: 'Updated description',
  placeholders: ['client_name', 'executor_name', 'beneficiary'],
  tags: ['will', 'estate', 'updated']
});
assert(updatedTmpl.description === 'Updated description', 'Description updated');
assert(JSON.parse(updatedTmpl.placeholders_json).length === 3, 'Placeholders updated');
assert(JSON.parse(updatedTmpl.tags_json).includes('updated'), 'Tags updated');

section('Templates: Slug uniqueness');

// Unique slug constraint
let slugThrew = false;
try {
  createTemplate({ slug: 'test-will', name: 'Dupe', sourcePath: '/x', placeholders: [], tags: [] });
} catch (e) {
  slugThrew = true;
}
assert(slugThrew, 'Duplicate slug rejected by UNIQUE constraint');

// ==============================
// DRAFTS
// ==============================
section('Drafts: CRUD');

const draft1 = createDraft({
  clientId: clientA.id,
  matterId: matterA1.id,
  templateId: tmpl1.id,
  title: 'Simple Will',
  draftType: 'will',
  filePath: '/test/drafts/simple-will-v1.md',
  version: 1
});
assert(draft1 !== null, 'Draft created');
assert(draft1.id.startsWith('draft_'), 'Draft ID has correct prefix');
assert(draft1.client_id === clientA.id, 'Draft linked to client');
assert(draft1.matter_id === matterA1.id, 'Draft linked to matter');
assert(draft1.template_id === tmpl1.id, 'Draft linked to template');
assert(draft1.version === 1, 'Draft version is 1');
assert(draft1.status === 'draft', 'Draft default status correct');

// Get by ID
const fetchedDraft = getDraftById(draft1.id);
assert(fetchedDraft !== null, 'Draft retrievable by ID');

// List by client
const clientDrafts = listDraftsByClient(clientA.id);
assert(clientDrafts.length >= 1, 'Draft appears in client list');

// List by client + matter
const matterDrafts = listDraftsByClient(clientA.id, { matterId: matterA1.id });
assert(matterDrafts.length >= 1, 'Draft appears in matter-scoped list');

// No leakage to other client
const otherDrafts = listDraftsByClient(clientB.id);
assert(otherDrafts.length === 0, 'No draft leakage to other client');

section('Drafts: Version scoping');

// Create v2 of same draft in same matter
const draft2 = createDraft({
  clientId: clientA.id,
  matterId: matterA1.id,
  title: 'Simple Will',
  filePath: '/test/drafts/simple-will-v2.md',
  version: 2
});

// Create same title in different matter
const draftOtherMatter = createDraft({
  clientId: clientA.id,
  matterId: matterA2.id,
  title: 'Simple Will',
  filePath: '/test/drafts/simple-will-other-v1.md',
  version: 1
});

// Version scoping should separate matters
const versionsM1 = listDraftVersions(clientA.id, 'Simple Will', { matterId: matterA1.id });
assert(versionsM1.length === 2, 'Two versions in matter A1');
assert(versionsM1[0].version > versionsM1[1].version, 'Versions sorted descending');

const versionsM2 = listDraftVersions(clientA.id, 'Simple Will', { matterId: matterA2.id });
assert(versionsM2.length === 1, 'One version in matter A2 (scoped correctly)');

// Client-level drafts (no matter)
const clientLevelDraft = createDraft({
  clientId: clientA.id,
  title: 'Client Memo',
  filePath: '/test/drafts/memo-v1.md',
  version: 1
});
const clientVersions = listDraftVersions(clientA.id, 'Client Memo');
assert(clientVersions.length === 1, 'Client-level draft version listed');

// Update draft
const updatedDraft = updateDraft(draft1.id, { status: 'final' });
assert(updatedDraft.status === 'final', 'Draft status updated');

section('Drafts: Cross-client ownership validation');

// Try to create draft linking client A with matter B1 (belongs to client B)
let crossClientThrew = false;
try {
  createDraft({
    clientId: clientA.id,
    matterId: matterB1.id,
    title: 'Bad Draft',
    filePath: '/test/bad.md'
  });
} catch (e) {
  crossClientThrew = true;
}
assert(crossClientThrew, 'Cross-client draft blocked (client A + matter B1)');

// Try nonexistent matter
let noMatterThrew = false;
try {
  createDraft({
    clientId: clientA.id,
    matterId: 'nonexistent_matter',
    title: 'Bad',
    filePath: '/test/bad.md'
  });
} catch (e) {
  noMatterThrew = true;
}
assert(noMatterThrew, 'Draft with nonexistent matter blocked');

// ==============================
// CONVERSATIONS
// ==============================
section('Conversations: CRUD');

const conv1 = createConversation({
  clientId: clientA.id,
  matterId: matterA1.id,
  title: 'Estate discussion',
  provider: 'claude'
});
assert(conv1 !== null, 'Conversation created');
assert(conv1.id.startsWith('conv_'), 'Conversation ID has correct prefix');
assert(conv1.client_id === clientA.id, 'Conversation linked to client');
assert(conv1.matter_id === matterA1.id, 'Conversation linked to matter');
assert(conv1.provider === 'claude', 'Provider stored');

// Get by ID
const fetchedConv = getConversationById(conv1.id);
assert(fetchedConv !== null, 'Conversation retrievable by ID');

// List scoped by client
const clientConvs = listConversations({ clientId: clientA.id });
assert(clientConvs.length >= 1, 'Conversation listed by client');

// List scoped by matter
const matterConvs = listConversations({ clientId: clientA.id, matterId: matterA1.id });
assert(matterConvs.length >= 1, 'Conversation listed by matter');

// No leakage
const otherConvs = listConversations({ clientId: clientB.id });
assert(otherConvs.length === 0, 'No conversation leakage to other client');

// Unscoped conversation
const generalConv = createConversation({ title: 'General chat' });
assert(generalConv.client_id === null, 'Unscoped conversation has null client');
assert(generalConv.matter_id === null, 'Unscoped conversation has null matter');

// Update
const updatedConv = updateConversation(conv1.id, { title: 'Renamed discussion' });
assert(updatedConv.title === 'Renamed discussion', 'Conversation title updated');

section('Conversations: Cross-client ownership validation');

let crossConvThrew = false;
try {
  createConversation({ clientId: clientA.id, matterId: matterB1.id, title: 'Bad conv' });
} catch (e) {
  crossConvThrew = true;
}
assert(crossConvThrew, 'Cross-client conversation blocked (client A + matter B1)');

// ==============================
// MESSAGES
// ==============================
section('Messages: CRUD and ordering');

const msg1 = addMessage({ conversationId: conv1.id, role: 'user', content: 'First message' });
assert(msg1 !== null, 'Message created');
assert(msg1.id.startsWith('msg_'), 'Message ID has correct prefix');
assert(msg1.role === 'user', 'Message role stored');
assert(msg1.content === 'First message', 'Message content stored');

const msg2 = addMessage({ conversationId: conv1.id, role: 'assistant', content: 'Second message' });
const msg3 = addMessage({ conversationId: conv1.id, role: 'user', content: 'Third message' });

// Retrieve in order
const messages = getMessages(conv1.id);
assert(messages.length === 3, 'All messages retrieved');
assert(messages[0].content === 'First message', 'First message in order');
assert(messages[1].content === 'Second message', 'Second message in order');
assert(messages[2].content === 'Third message', 'Third message in order');

// Messages with metadata
const msgWithMeta = addMessage({
  conversationId: conv1.id,
  role: 'assistant',
  content: 'Tool result',
  metadata: { tool: 'Read', file: '/test.md' }
});
assert(msgWithMeta.metadata_json !== null, 'Metadata JSON stored');
const parsedMeta = JSON.parse(msgWithMeta.metadata_json);
assert(parsedMeta.tool === 'Read', 'Metadata content correct');

// Messages from other conversation don't leak
const conv2 = createConversation({ clientId: clientA.id, title: 'Other conv' });
addMessage({ conversationId: conv2.id, role: 'user', content: 'Different conv message' });
const conv1Messages = getMessages(conv1.id);
assert(conv1Messages.length === 4, 'Messages scoped to conversation (no leakage)');
assert(!conv1Messages.some(m => m.content === 'Different conv message'), 'Other conv messages not present');

// FK constraint: message to nonexistent conversation
let fkThrew = false;
try {
  addMessage({ conversationId: 'nonexistent_conv', role: 'user', content: 'Bad' });
} catch (e) {
  fkThrew = true;
}
assert(fkThrew, 'Message to nonexistent conversation blocked by FK');

// ==============================
// CLEANUP AND SUMMARY
// ==============================
section('Cleanup');

db.prepare("DELETE FROM messages").run();
db.prepare("DELETE FROM conversations").run();
db.prepare("DELETE FROM source_documents").run();
db.prepare("DELETE FROM documents").run();
db.prepare("DELETE FROM drafts").run();
db.prepare("DELETE FROM templates").run();
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
  console.log('ALL ACCEPTANCE CRITERIA PASSED');
  process.exit(0);
}

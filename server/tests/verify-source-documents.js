/**
 * Equal Scales — Phase 6 Verification
 * Source Documents + Context Assembly
 *
 * Usage: cd server && node tests/verify-source-documents.js
 */

import { initDatabase, getDb, closeDatabase } from '../storage/db.js';
import { createClient, updateClient } from '../storage/repositories/clients.js';
import { createMatter, updateMatter } from '../storage/repositories/matters.js';
import { createSourceDocument, getSourceDocumentById, listSourceDocumentsByMatter, deleteSourceDocument } from '../storage/repositories/source-documents.js';
import { createClientVault, createMatterVault } from '../services/vault-service.js';
import { gatherContext, formatContextForPrompt } from '../services/context-service.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  PASS  ${label}`); passed++; }
  else { console.error(`  FAIL  ${label}`); failed++; }
}

function section(title) { console.log(`\n--- ${title} ---`); }

initDatabase();
const db = getDb();

// Clean
db.prepare("DELETE FROM source_documents").run();
db.prepare("DELETE FROM documents").run();
db.prepare("DELETE FROM messages").run();
db.prepare("DELETE FROM conversations").run();
db.prepare("DELETE FROM drafts").run();
db.prepare("DELETE FROM matters").run();
db.prepare("DELETE FROM clients").run();

// Setup: client + matter with vault
const client = createClient({ name: 'SourceDoc Test Client' });
const clientVault = createClientVault(client);
updateClient(client.id, { root_path: clientVault });
client.root_path = clientVault;

const matter = createMatter({ clientId: client.id, name: 'SourceDoc Test Matter', matterType: 'estate' });
const matterVault = createMatterVault(client, matter);
updateMatter(matter.id, { matter_path: matterVault });
matter.matter_path = matterVault;

// Write test source files
const sourceDocsDir = path.join(matterVault, 'source-documents');
const testFilePath = path.join(sourceDocsDir, 'test-intake.txt');
fs.writeFileSync(testFilePath, 'Client intake notes:\n- Full name: John A. Smith\n- DOB: March 15, 1955\n- Spouse: Jane Smith\n- Children: Alice (30), Robert (28)\n- Estate value: approximately $2.5M\n', 'utf-8');

const testMdPath = path.join(sourceDocsDir, 'prior-correspondence.md');
fs.writeFileSync(testMdPath, '# Prior Correspondence\n\nEmail from client on 2026-03-01:\n> I would like to create a simple will. My primary concern is ensuring my spouse is provided for.\n', 'utf-8');

// ==============================
// Source Document CRUD
// ==============================
section('Source document CRUD');

const sdoc1 = createSourceDocument({
  matterId: matter.id,
  filename: 'test-intake.txt',
  filePath: testFilePath,
  fileType: 'txt',
  fileSize: fs.statSync(testFilePath).size,
  description: 'Client intake notes',
  contentText: fs.readFileSync(testFilePath, 'utf-8')
});

assert(sdoc1 !== null, 'Source document created');
assert(sdoc1.id.startsWith('sdoc_'), 'ID has correct prefix');
assert(sdoc1.matter_id === matter.id, 'Linked to correct matter');
assert(sdoc1.filename === 'test-intake.txt', 'Filename stored');
assert(sdoc1.file_type === 'txt', 'File type stored');
assert(sdoc1.file_size > 0, 'File size stored');
assert(sdoc1.content_text !== null, 'Content text stored');
assert(sdoc1.content_text.includes('John A. Smith'), 'Content text has expected data');

// Get by ID
const fetched = getSourceDocumentById(sdoc1.id);
assert(fetched !== null, 'Retrievable by ID');
assert(fetched.filename === 'test-intake.txt', 'Filename matches');

// Create second
const sdoc2 = createSourceDocument({
  matterId: matter.id,
  filename: 'prior-correspondence.md',
  filePath: testMdPath,
  fileType: 'md',
  fileSize: fs.statSync(testMdPath).size,
  contentText: fs.readFileSync(testMdPath, 'utf-8')
});
assert(sdoc2 !== null, 'Second source doc created');

// List by matter
const matterDocs = listSourceDocumentsByMatter(matter.id);
assert(matterDocs.length === 2, 'Both docs listed under matter');

// No leakage to other matters
const matter2 = createMatter({ clientId: client.id, name: 'Other Matter' });
const otherDocs = listSourceDocumentsByMatter(matter2.id);
assert(otherDocs.length === 0, 'No leakage to other matter');

// FK constraint
let fkThrew = false;
try {
  createSourceDocument({ matterId: 'nonexistent', filename: 'x', filePath: '/x' });
} catch (e) { fkThrew = true; }
assert(fkThrew, 'FK constraint blocks nonexistent matter');

// ==============================
// Context assembly with source docs
// ==============================
section('Context assembly');

// Write matter files for context
fs.writeFileSync(path.join(matterVault, 'matter.md'), '# SourceDoc Test Matter\n\nEstate planning for John Smith.\n', 'utf-8');
fs.writeFileSync(path.join(matterVault, 'facts.md'), '# Facts\n\n- Client is 71 years old\n- Primary residence in Springfield, IL\n', 'utf-8');

const context = gatherContext({ clientId: client.id, matterId: matter.id });
assert(context.client !== null, 'Context has client');
assert(context.matter !== null, 'Context has matter');
assert(context.sourceDocuments !== undefined, 'Context has sourceDocuments array');
assert(context.sourceDocuments.length === 2, 'Context includes 2 source documents');
assert(context.sourceDocuments.some(d => d.filename === 'test-intake.txt'), 'Intake doc in context');
assert(context.sourceDocuments.some(d => d.filename === 'prior-correspondence.md'), 'Correspondence doc in context');

// Format for prompt
const formatted = formatContextForPrompt(context);
assert(formatted.includes('Source Documents (2)'), 'Formatted includes source doc section header');
assert(formatted.includes('John A. Smith'), 'Formatted includes intake data');
assert(formatted.includes('Prior Correspondence'), 'Formatted includes correspondence content');
assert(formatted.includes('SourceDoc Test Client'), 'Formatted includes client name');
assert(formatted.includes('SourceDoc Test Matter'), 'Formatted includes matter name');

// Binary docs (no content_text) should not appear in context
const binaryDoc = createSourceDocument({
  matterId: matter.id,
  filename: 'contract.pdf',
  filePath: '/fake/path.pdf',
  fileType: 'pdf',
  fileSize: 50000,
  contentText: null  // no text extracted
});
const contextWithBinary = gatherContext({ clientId: client.id, matterId: matter.id });
assert(contextWithBinary.sourceDocuments.length === 2, 'Binary doc excluded from text context');

// ==============================
// Delete
// ==============================
section('Delete');

deleteSourceDocument(sdoc1.id);
assert(getSourceDocumentById(sdoc1.id) === null, 'Deleted doc gone');
assert(listSourceDocumentsByMatter(matter.id).length === 2, 'Remaining docs listed');  // sdoc2 + binaryDoc

// ==============================
// Cleanup
// ==============================
section('Cleanup');

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

if (failed > 0) { console.error('VERIFICATION FAILED'); process.exit(1); }
else { console.log('ALL SOURCE DOCUMENT TESTS PASSED'); process.exit(0); }

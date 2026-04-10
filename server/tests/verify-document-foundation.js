/**
 * Equal Scales — Milestone 3 Slice 01 Verification
 * Document Workspace Foundation
 *
 * Verifies OUTCOME-C1 through C3:
 * - C1: Document workspace can be opened (API + build exists)
 * - C2: Structured editing (Tiptap JSON state round-trips)
 * - C3: Save and reload document (matter-scoped persistence)
 *
 * Usage: cd server && node tests/verify-document-foundation.js
 */

import { initDatabase, getDb, closeDatabase } from '../storage/db.js';
import { createClient } from '../storage/repositories/clients.js';
import { createMatter } from '../storage/repositories/matters.js';
import { createDocument, getDocumentById, listDocumentsByMatter, updateDocument, deleteDocument } from '../storage/repositories/documents.js';
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
db.prepare("DELETE FROM source_documents").run();
db.prepare("DELETE FROM documents").run();
db.prepare("DELETE FROM drafts").run();
db.prepare("DELETE FROM matters").run();
db.prepare("DELETE FROM clients").run();

// Setup
const client = createClient({ name: 'Doc Test Client' });
const matter = createMatter({ clientId: client.id, name: 'Doc Test Matter', matterType: 'estate' });

// ==============================
// OUTCOME-C1: Document workspace exists
// ==============================
section('C1: Document workspace shell');

// Verify the built React workspace exists
const distDir = path.join(process.cwd(), '..', 'renderer', 'document-dist');
const distIndex = path.join(distDir, 'index.html');
assert(fs.existsSync(distDir), 'Document workspace build output exists');
assert(fs.existsSync(distIndex), 'Document workspace index.html built');

// Verify documents table exists
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
assert(tables.includes('documents'), 'documents table exists in schema');

// ==============================
// OUTCOME-C2: Structured editing (JSON state)
// ==============================
section('C2: Structured document state');

const tiptapContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Last Will and Testament' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'I, ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'John Smith' },
        { type: 'text', text: ', being of sound mind...' }
      ]
    },
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Beneficiary: Jane Smith' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Executor: Alice Smith' }] }] }
      ]
    }
  ]
};

const doc = createDocument({
  matterId: matter.id,
  title: 'Test Will Document',
  contentJson: tiptapContent
});

assert(doc !== null, 'Document created');
assert(doc.id.startsWith('doc_'), 'Document ID has correct prefix');
assert(doc.matter_id === matter.id, 'Document linked to matter');
assert(doc.title === 'Test Will Document', 'Title stored correctly');
assert(doc.content_json !== null, 'Content JSON stored');

// Parse and verify JSON round-trip
const parsed = JSON.parse(doc.content_json);
assert(parsed.type === 'doc', 'Content JSON has doc type');
assert(parsed.content.length === 3, 'Content has 3 top-level nodes');
assert(parsed.content[0].type === 'heading', 'First node is heading');
assert(parsed.content[0].content[0].text === 'Last Will and Testament', 'Heading text preserved');
assert(parsed.content[1].content[1].marks[0].type === 'bold', 'Bold mark preserved');
assert(parsed.content[2].type === 'bulletList', 'Bullet list preserved');

// ==============================
// OUTCOME-C3: Save and reload
// ==============================
section('C3: Save and reload');

// Retrieve by ID
const fetched = getDocumentById(doc.id);
assert(fetched !== null, 'Document retrievable by ID');
assert(fetched.title === doc.title, 'Title matches on reload');

const fetchedContent = JSON.parse(fetched.content_json);
assert(JSON.stringify(fetchedContent) === JSON.stringify(tiptapContent), 'Content JSON round-trips exactly');

// Update content
const updatedContent = {
  ...tiptapContent,
  content: [
    ...tiptapContent.content,
    { type: 'paragraph', content: [{ type: 'text', text: 'Added paragraph after edit.' }] }
  ]
};

const updated = updateDocument(doc.id, { content_json: updatedContent });
assert(updated !== null, 'Document updated');
const updatedParsed = JSON.parse(updated.content_json);
assert(updatedParsed.content.length === 4, 'Updated content has 4 nodes');
assert(updatedParsed.content[3].content[0].text === 'Added paragraph after edit.', 'New paragraph content preserved');

// Update title
const renamedDoc = updateDocument(doc.id, { title: 'Renamed Will' });
assert(renamedDoc.title === 'Renamed Will', 'Title update works');

// Update status
const statusDoc = updateDocument(doc.id, { status: 'active' });
assert(statusDoc.status === 'active', 'Status update works');

// ==============================
// MATTER SCOPING
// ==============================
section('Matter scoping');

// List by matter
const matterDocs = listDocumentsByMatter(matter.id);
assert(matterDocs.length >= 1, 'Document listed under matter');

// Create second matter — verify no leakage
const matter2 = createMatter({ clientId: client.id, name: 'Other Matter' });
const otherDocs = listDocumentsByMatter(matter2.id);
assert(otherDocs.length === 0, 'Other matter has no documents (no leakage)');

// Document must belong to a matter (FK constraint)
let fkThrew = false;
try {
  createDocument({ matterId: 'nonexistent_matter', title: 'Bad Doc' });
} catch (e) {
  fkThrew = true;
}
assert(fkThrew, 'Document with nonexistent matter blocked by FK');

// ==============================
// DELETE
// ==============================
section('Document deletion');

const doc2 = createDocument({ matterId: matter.id, title: 'Temp Doc' });
assert(getDocumentById(doc2.id) !== null, 'Temp doc exists before delete');
deleteDocument(doc2.id);
assert(getDocumentById(doc2.id) === null, 'Temp doc gone after delete');

// ==============================
// CLEANUP
// ==============================
section('Cleanup');
db.prepare("DELETE FROM source_documents").run();
db.prepare("DELETE FROM documents").run();
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
  console.log('ALL DOCUMENT FOUNDATION TESTS PASSED');
  process.exit(0);
}

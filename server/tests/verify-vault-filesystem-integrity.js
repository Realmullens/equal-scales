/**
 * Equal Scales — Milestone 1 Slice 03 Verification
 * Vault Filesystem Integrity
 *
 * Verifies that client/matter creation produces correct directories,
 * starter files, and that vault path safety holds.
 *
 * Usage: cd server && node tests/verify-vault-filesystem-integrity.js
 */

import { initDatabase, getDb, closeDatabase } from '../storage/db.js';
import { createClient, updateClient } from '../storage/repositories/clients.js';
import { createMatter, updateMatter } from '../storage/repositories/matters.js';
import { createClientVault, createMatterVault } from '../services/vault-service.js';
import { VAULT_ROOT, CLIENTS_DIR, TEMPLATES_DIR, clientDir, matterDir, matterDraftsDir, matterSourceDocsDir } from '../storage/paths.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

// ==============================
// VAULT ROOT STRUCTURE
// ==============================
section('Vault root structure');

assert(fs.existsSync(VAULT_ROOT), 'Vault root exists: ' + VAULT_ROOT);
assert(fs.existsSync(CLIENTS_DIR), 'Clients directory exists');
assert(fs.existsSync(TEMPLATES_DIR), 'Templates directory exists');
assert(fs.statSync(VAULT_ROOT).isDirectory(), 'Vault root is a directory');
assert(fs.statSync(CLIENTS_DIR).isDirectory(), 'Clients dir is a directory');
assert(fs.statSync(TEMPLATES_DIR).isDirectory(), 'Templates dir is a directory');

// DB file should exist but not be visible in file browser API
const dbPath = path.join(VAULT_ROOT, 'equal-scales.db');
assert(fs.existsSync(dbPath), 'Database file exists on disk');

// ==============================
// CLIENT VAULT CREATION
// ==============================
section('Client vault creation');

// Clean: create a fresh test client
const testClient = createClient({ name: 'Vault Test Client', displayName: 'Vault Test Client' });
const clientVaultPath = createClientVault(testClient);

assert(clientVaultPath !== null, 'createClientVault returns a path');
assert(fs.existsSync(clientVaultPath), 'Client vault directory exists on disk');
assert(fs.statSync(clientVaultPath).isDirectory(), 'Client vault is a directory');

// Check starter files
const profilePath = path.join(clientVaultPath, 'profile.md');
const notesPath = path.join(clientVaultPath, 'notes.md');
const mattersSubdir = path.join(clientVaultPath, 'matters');

assert(fs.existsSync(profilePath), 'profile.md exists');
assert(fs.existsSync(notesPath), 'notes.md exists');
assert(fs.existsSync(mattersSubdir), 'matters/ subdirectory exists');
assert(fs.statSync(mattersSubdir).isDirectory(), 'matters/ is a directory');

// Check profile.md content
const profileContent = fs.readFileSync(profilePath, 'utf-8');
assert(profileContent.includes('Vault Test Client'), 'profile.md contains client name');
assert(profileContent.includes('Contact Information'), 'profile.md has expected structure');

// Check notes.md content
const notesContent = fs.readFileSync(notesPath, 'utf-8');
assert(notesContent.includes('Vault Test Client'), 'notes.md contains client name');

// Verify path stored in DB matches filesystem
updateClient(testClient.id, { root_path: clientVaultPath });
const storedClient = db.prepare('SELECT root_path FROM clients WHERE id = ?').get(testClient.id);
assert(storedClient.root_path === clientVaultPath, 'Stored root_path matches vault path');
assert(fs.existsSync(storedClient.root_path), 'Stored root_path exists on disk');

// Idempotency: calling createClientVault again should not overwrite existing files
fs.appendFileSync(profilePath, '\n<!-- custom note -->');
createClientVault(testClient); // should use writeIfNotExists
const profileAfter = fs.readFileSync(profilePath, 'utf-8');
assert(profileAfter.includes('<!-- custom note -->'), 'Re-run does not overwrite existing profile.md');

// ==============================
// MATTER VAULT CREATION
// ==============================
section('Matter vault creation');

const testMatter = createMatter({ clientId: testClient.id, name: 'Vault Test Matter', matterType: 'estate' });
// Need to set client root_path for createMatterVault to use
const clientForMatter = { ...testClient, root_path: clientVaultPath };
const matterVaultPath = createMatterVault(clientForMatter, testMatter);

assert(matterVaultPath !== null, 'createMatterVault returns a path');
assert(fs.existsSync(matterVaultPath), 'Matter vault directory exists on disk');
assert(fs.statSync(matterVaultPath).isDirectory(), 'Matter vault is a directory');

// Check starter files
const matterMdPath = path.join(matterVaultPath, 'matter.md');
const factsPath = path.join(matterVaultPath, 'facts.md');
const tasksPath = path.join(matterVaultPath, 'tasks.md');
const draftsDir = path.join(matterVaultPath, 'drafts');
const sourceDocsDir = path.join(matterVaultPath, 'source-documents');

assert(fs.existsSync(matterMdPath), 'matter.md exists');
assert(fs.existsSync(factsPath), 'facts.md exists');
assert(fs.existsSync(tasksPath), 'tasks.md exists');
assert(fs.existsSync(draftsDir), 'drafts/ directory exists');
assert(fs.existsSync(sourceDocsDir), 'source-documents/ directory exists');
assert(fs.statSync(draftsDir).isDirectory(), 'drafts/ is a directory');
assert(fs.statSync(sourceDocsDir).isDirectory(), 'source-documents/ is a directory');

// Check matter.md content
const matterContent = fs.readFileSync(matterMdPath, 'utf-8');
assert(matterContent.includes('Vault Test Matter'), 'matter.md contains matter name');
assert(matterContent.includes('Vault Test Client'), 'matter.md contains client name');
assert(matterContent.includes('estate'), 'matter.md contains matter type');

// Check facts.md content
const factsContent = fs.readFileSync(factsPath, 'utf-8');
assert(factsContent.includes('Vault Test Matter'), 'facts.md contains matter name');

// Check tasks.md content
const tasksContent = fs.readFileSync(tasksPath, 'utf-8');
assert(tasksContent.includes('Vault Test Matter'), 'tasks.md contains matter name');

// Verify stored path matches
updateMatter(testMatter.id, { matter_path: matterVaultPath });
const storedMatter = db.prepare('SELECT matter_path FROM matters WHERE id = ?').get(testMatter.id);
assert(storedMatter.matter_path === matterVaultPath, 'Stored matter_path matches vault path');
assert(fs.existsSync(storedMatter.matter_path), 'Stored matter_path exists on disk');

// ==============================
// PATH HELPER FUNCTIONS
// ==============================
section('Path helper functions');

const expectedClientDir = clientDir('Test Name', 'client_123');
assert(expectedClientDir.startsWith(CLIENTS_DIR), 'clientDir starts with CLIENTS_DIR');
assert(expectedClientDir.includes('Test Name'), 'clientDir includes client name');
assert(expectedClientDir.includes('client_123'), 'clientDir includes client ID');

const expectedMatterDir = matterDir(expectedClientDir, 'Estate Planning', 'matter_456');
assert(expectedMatterDir.includes('matters'), 'matterDir includes matters subdirectory');
assert(expectedMatterDir.includes('Estate Planning'), 'matterDir includes matter name');
assert(expectedMatterDir.includes('matter_456'), 'matterDir includes matter ID');

const expectedDraftsDir = matterDraftsDir(expectedMatterDir);
assert(expectedDraftsDir.endsWith('/drafts'), 'matterDraftsDir ends with /drafts');

const expectedSourceDir = matterSourceDocsDir(expectedMatterDir);
assert(expectedSourceDir.endsWith('/source-documents'), 'matterSourceDocsDir ends with /source-documents');

// ==============================
// VAULT PATH SAFETY
// ==============================
section('Vault path safety');

// Simulate the isInsideVault check from main.js
function isInsideVault(fullPath) {
  const normalized = path.resolve(fullPath);
  return normalized === VAULT_ROOT || normalized.startsWith(VAULT_ROOT + path.sep);
}

// Valid paths
assert(isInsideVault(VAULT_ROOT), 'Vault root itself is valid');
assert(isInsideVault(path.join(VAULT_ROOT, 'clients')), 'clients/ is valid');
assert(isInsideVault(path.join(VAULT_ROOT, 'clients', 'test', 'matters')), 'Nested path is valid');
assert(isInsideVault(clientVaultPath), 'Created client path is valid');
assert(isInsideVault(matterVaultPath), 'Created matter path is valid');

// Invalid paths — must be blocked
assert(!isInsideVault('/etc/passwd'), 'Absolute outside path blocked');
assert(!isInsideVault('/tmp/test'), '/tmp path blocked');
assert(!isInsideVault(os.homedir()), 'Home directory blocked');
assert(!isInsideVault(path.resolve(VAULT_ROOT, '..', 'EqualScalesVault-backup')), 'Prefix escape blocked');
assert(!isInsideVault(path.resolve(VAULT_ROOT, '..', '..')), 'Traversal up blocked');
assert(!isInsideVault(path.resolve(VAULT_ROOT, '..', 'etc', 'passwd')), 'Traversal to system blocked');

// ==============================
// TEMPLATE DIRECTORY STRUCTURE
// ==============================
section('Template directory structure');

const expectedCategories = ['estate', 'litigation', 'contracts', 'intake', 'client-communications'];
for (const cat of expectedCategories) {
  const catDir = path.join(TEMPLATES_DIR, cat);
  assert(fs.existsSync(catDir), `Template category "${cat}" directory exists`);
}

// Check that seeded templates exist
const estateTemplates = fs.readdirSync(path.join(TEMPLATES_DIR, 'estate')).filter(f => f.endsWith('.md'));
assert(estateTemplates.length >= 1, 'At least one estate template exists');

const litigationTemplates = fs.readdirSync(path.join(TEMPLATES_DIR, 'litigation')).filter(f => f.endsWith('.md'));
assert(litigationTemplates.length >= 1, 'At least one litigation template exists');

// ==============================
// CLEANUP
// ==============================
section('Cleanup');

// Remove test vault directories
fs.rmSync(clientVaultPath, { recursive: true, force: true });
assert(!fs.existsSync(clientVaultPath), 'Test client vault cleaned up');

// Remove test DB records
db.prepare("DELETE FROM matters WHERE id = ?").run(testMatter.id);
db.prepare("DELETE FROM clients WHERE id = ?").run(testClient.id);

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

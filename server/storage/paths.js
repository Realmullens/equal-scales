/**
 * Equal Scales Vault Path Strategy
 *
 * All Equal Scales data lives under ~/EqualScalesVault/.
 * This module resolves paths for the vault root, database,
 * client directories, matter directories, templates, and drafts.
 *
 * Phase 1: path resolution only — no directory creation here.
 * Directory creation is handled by vault-service (Phase 2).
 */

import path from 'path';
import os from 'os';

// Vault root — all persistent Equal Scales data lives here
const VAULT_ROOT = path.join(os.homedir(), 'EqualScalesVault');

// Database lives at the vault root
const DB_PATH = path.join(VAULT_ROOT, 'equal-scales.db');

// Top-level vault directories
const TEMPLATES_DIR = path.join(VAULT_ROOT, 'templates');
const CLIENTS_DIR = path.join(VAULT_ROOT, 'clients');

/**
 * Build a deterministic directory name from an id and slug.
 * Example: buildDirName('client_001', 'jane-doe') => 'client_001-jane-doe'
 */
function buildDirName(id, slug) {
  return `${id}-${slug}`;
}

/**
 * Resolve the filesystem path for a client directory.
 */
function clientDir(clientId, clientSlug) {
  return path.join(CLIENTS_DIR, buildDirName(clientId, clientSlug));
}

/**
 * Resolve the filesystem path for a matter directory under a client.
 */
function matterDir(clientId, clientSlug, matterId, matterSlug) {
  return path.join(clientDir(clientId, clientSlug), 'matters', buildDirName(matterId, matterSlug));
}

/**
 * Resolve the drafts directory for a matter.
 */
function matterDraftsDir(clientId, clientSlug, matterId, matterSlug) {
  return path.join(matterDir(clientId, clientSlug, matterId, matterSlug), 'drafts');
}

/**
 * Resolve the source-documents directory for a matter.
 */
function matterSourceDocsDir(clientId, clientSlug, matterId, matterSlug) {
  return path.join(matterDir(clientId, clientSlug, matterId, matterSlug), 'source-documents');
}

/**
 * Resolve a template category directory.
 */
function templateCategoryDir(category) {
  return path.join(TEMPLATES_DIR, category);
}

export {
  VAULT_ROOT,
  DB_PATH,
  TEMPLATES_DIR,
  CLIENTS_DIR,
  buildDirName,
  clientDir,
  matterDir,
  matterDraftsDir,
  matterSourceDocsDir,
  templateCategoryDir
};

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
 * Sanitize a name for use as a folder name.
 * Keeps it human-readable in Finder.
 */
function sanitizeFolderName(name) {
  return name.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
}

/**
 * Build directory name: Name_ID
 * Name comes first for alphabetical sorting in Finder.
 * ID is appended for uniqueness.
 * Example: "Jane Doe_client_001"
 */
function buildClientDirName(name, id) {
  return `${sanitizeFolderName(name)}_${id}`;
}

function buildMatterDirName(name, id) {
  return `${sanitizeFolderName(name)}_${id}`;
}

/**
 * Resolve the filesystem path for a client directory.
 * Format: ClientName_clientID — sorts alphabetically by name in Finder.
 */
function clientDir(clientName, clientId) {
  return path.join(CLIENTS_DIR, buildClientDirName(clientName, clientId));
}

/**
 * Resolve the filesystem path for a matter directory under a client.
 * Format: MatterName_matterID
 */
function matterDir(clientDirPath, matterName, matterId) {
  return path.join(clientDirPath, 'matters', buildMatterDirName(matterName, matterId));
}

/**
 * Resolve the drafts directory for a matter.
 */
function matterDraftsDir(matterDirPath) {
  return path.join(matterDirPath, 'drafts');
}

/**
 * Resolve the source-documents directory for a matter.
 */
function matterSourceDocsDir(matterDirPath) {
  return path.join(matterDirPath, 'source-documents');
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
  sanitizeFolderName,
  clientDir,
  matterDir,
  matterDraftsDir,
  matterSourceDocsDir,
  templateCategoryDir
};

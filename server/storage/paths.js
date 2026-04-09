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
 * Build a human-readable directory name from a display name.
 * If a collision exists, appends a short numeric suffix.
 * Example: "Jane Doe" or "Jane Doe (2)"
 */
function buildClientDirName(name) {
  return sanitizeFolderName(name);
}

function buildMatterDirName(name) {
  return sanitizeFolderName(name);
}

/**
 * Resolve the filesystem path for a client directory.
 * Uses the human-readable client name as the folder name.
 */
function clientDir(clientName) {
  return path.join(CLIENTS_DIR, buildClientDirName(clientName));
}

/**
 * Resolve the filesystem path for a matter directory under a client.
 */
function matterDir(clientDirPath, matterName) {
  return path.join(clientDirPath, 'matters', buildMatterDirName(matterName));
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

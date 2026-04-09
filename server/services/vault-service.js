/**
 * Equal Scales — Vault Service
 *
 * Creates filesystem directories and starter markdown files
 * when clients and matters are created. Uses paths from storage/paths.js.
 *
 * Filesystem operations are best-effort: failures are logged but don't
 * roll back database records (filesystem can be repaired; lost DB rows can't).
 */

import fs from 'fs';
import path from 'path';
import { clientDir, matterDir, matterDraftsDir, matterSourceDocsDir } from '../storage/paths.js';

/**
 * Create the vault directory structure for a new client.
 * Writes profile.md and notes.md starter files.
 */
function createClientVault(client) {
  const dir = clientDir(client.display_name || client.name, client.id);

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(path.join(dir, 'matters'), { recursive: true });

    // profile.md — client overview
    const profileContent = `# ${client.display_name || client.name}

## Contact Information
- **Name:** ${client.display_name || client.name}
- **Status:** ${client.status}

## Notes
_Add client notes here._

---
*Created: ${new Date().toISOString().split('T')[0]}*
`;
    writeIfNotExists(path.join(dir, 'profile.md'), profileContent);

    // notes.md — running notes
    const notesContent = `# Notes — ${client.display_name || client.name}

_Use this file for running notes about this client._

---
`;
    writeIfNotExists(path.join(dir, 'notes.md'), notesContent);

    console.log('[Vault] Created client directory:', dir);
    return dir;
  } catch (err) {
    console.error('[Vault] Failed to create client directory:', err.message);
    return null;
  }
}

/**
 * Create the vault directory structure for a new matter under a client.
 * Writes matter.md, facts.md, tasks.md and creates drafts/ and source-documents/ dirs.
 */
function createMatterVault(client, matter) {
  const clientPath = client.root_path || clientDir(client.display_name || client.name, client.id);
  const dir = matterDir(clientPath, matter.name, matter.id);

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(matterDraftsDir(dir), { recursive: true });
    fs.mkdirSync(matterSourceDocsDir(dir), { recursive: true });

    // matter.md — matter overview
    const matterContent = `# ${matter.name}

## Matter Details
- **Client:** ${client.display_name || client.name}
- **Type:** ${matter.matter_type || 'General'}
- **Status:** ${matter.status}

## Summary
_Add a summary of this matter here._

## Key Dates
_Add important dates and deadlines._

---
*Created: ${new Date().toISOString().split('T')[0]}*
`;
    writeIfNotExists(path.join(dir, 'matter.md'), matterContent);

    // facts.md — relevant facts
    const factsContent = `# Facts — ${matter.name}

## Key Facts
_Document the relevant facts for this matter._

## Parties Involved
_List parties, witnesses, or other relevant individuals._

---
`;
    writeIfNotExists(path.join(dir, 'facts.md'), factsContent);

    // tasks.md — matter tasks
    const tasksContent = `# Tasks — ${matter.name}

## Pending
- [ ] _Add tasks here_

## Completed
_Move completed tasks here._

---
`;
    writeIfNotExists(path.join(dir, 'tasks.md'), tasksContent);

    console.log('[Vault] Created matter directory:', dir);
    return dir;
  } catch (err) {
    console.error('[Vault] Failed to create matter directory:', err.message);
    return null;
  }
}

/**
 * Write a file only if it doesn't already exist (idempotent).
 */
function writeIfNotExists(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

export { createClientVault, createMatterVault };

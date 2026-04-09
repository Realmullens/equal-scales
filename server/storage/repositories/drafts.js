/**
 * Equal Scales — Drafts Repository
 *
 * CRUD operations for draft records in SQLite.
 * Drafts are generated documents tied to a client (and optionally a matter/template).
 */

import { getDb } from '../db.js';
import crypto from 'crypto';

function generateId() {
  return 'draft_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

/**
 * Create a new draft record. Returns the created record.
 */
function createDraft({
  clientId,
  matterId = null,
  templateId = null,
  title,
  draftType = null,
  fileFormat = 'markdown',
  filePath,
  version = 1,
  status = 'draft'
}) {
  const db = getDb();
  const id = generateId();

  // Enforce: if matter is specified, it must belong to the same client
  if (matterId) {
    const matter = db.prepare('SELECT client_id FROM matters WHERE id = ?').get(matterId);
    if (!matter) throw new Error(`Matter ${matterId} not found`);
    if (matter.client_id !== clientId) {
      throw new Error(`Matter ${matterId} belongs to a different client — cross-client draft linking is not allowed`);
    }
  }

  const stmt = db.prepare(`
    INSERT INTO drafts (id, client_id, matter_id, template_id, title, draft_type, file_format, file_path, version, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, clientId, matterId, templateId, title, draftType, fileFormat, filePath, version, status);

  return getDraftById(id);
}

/**
 * Get a draft by ID.
 */
function getDraftById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM drafts WHERE id = ?').get(id) || null;
}

/**
 * List drafts for a client, optionally filtered by matter.
 */
function listDraftsByClient(clientId, { matterId = null, status = null } = {}) {
  const db = getDb();
  let query = 'SELECT * FROM drafts WHERE client_id = ?';
  const params = [clientId];

  if (matterId) {
    query += ' AND matter_id = ?';
    params.push(matterId);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY updated_at DESC';
  return db.prepare(query).all(...params);
}

/**
 * List all versions of a draft by matching client + matter + title.
 * matter_id scoping prevents conflating drafts with the same title across different matters.
 */
function listDraftVersions(clientId, title, { matterId = null } = {}) {
  const db = getDb();
  if (matterId) {
    return db.prepare(
      'SELECT * FROM drafts WHERE client_id = ? AND matter_id = ? AND title = ? ORDER BY version DESC'
    ).all(clientId, matterId, title);
  }
  return db.prepare(
    'SELECT * FROM drafts WHERE client_id = ? AND matter_id IS NULL AND title = ? ORDER BY version DESC'
  ).all(clientId, title);
}

/**
 * Update a draft's fields.
 */
function updateDraft(id, updates) {
  const db = getDb();
  const allowed = ['title', 'draft_type', 'file_format', 'file_path', 'version', 'status'];
  const sets = [];
  const values = [];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (sets.length === 0) return getDraftById(id);

  sets.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE drafts SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getDraftById(id);
}

export { createDraft, getDraftById, listDraftsByClient, listDraftVersions, updateDraft };

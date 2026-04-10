/**
 * Equal Scales — Source Documents Repository
 *
 * CRUD for source documents attached to matters.
 * Source documents are supporting files (PDFs, DOCX, etc.)
 * used as context for draft generation.
 */

import { getDb } from '../db.js';
import crypto from 'crypto';

function generateId() {
  return 'sdoc_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

function createSourceDocument({ matterId, filename, filePath, fileType = null, fileSize = null, description = null, contentText = null }) {
  const db = getDb();
  const id = generateId();

  db.prepare(`
    INSERT INTO source_documents (id, matter_id, filename, file_path, file_type, file_size, description, content_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, matterId, filename, filePath, fileType, fileSize, description, contentText);

  return getSourceDocumentById(id);
}

function getSourceDocumentById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM source_documents WHERE id = ?').get(id) || null;
}

function listSourceDocumentsByMatter(matterId) {
  const db = getDb();
  return db.prepare('SELECT * FROM source_documents WHERE matter_id = ? ORDER BY filename').all(matterId);
}

function updateSourceDocument(id, updates) {
  const db = getDb();
  const allowed = ['filename', 'description', 'content_text'];
  const sets = [];
  const values = [];

  for (const key of allowed) {
    if (updates[key] !== undefined) { sets.push(`${key} = ?`); values.push(updates[key]); }
  }

  if (sets.length === 0) return getSourceDocumentById(id);

  sets.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE source_documents SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getSourceDocumentById(id);
}

function deleteSourceDocument(id) {
  const db = getDb();
  db.prepare('DELETE FROM source_documents WHERE id = ?').run(id);
}

export { createSourceDocument, getSourceDocumentById, listSourceDocumentsByMatter, updateSourceDocument, deleteSourceDocument };

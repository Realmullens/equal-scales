/**
 * Equal Scales — Documents Repository
 *
 * CRUD for structured documents (Tiptap/ProseMirror JSON state).
 * Documents are matter-scoped — every document belongs to exactly one matter.
 */

import { getDb } from '../db.js';
import crypto from 'crypto';

function generateId() {
  return 'doc_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

function createDocument({ matterId, title, contentJson = null }) {
  const db = getDb();
  const id = generateId();

  db.prepare(`
    INSERT INTO documents (id, matter_id, title, content_json)
    VALUES (?, ?, ?, ?)
  `).run(id, matterId, title, contentJson ? JSON.stringify(contentJson) : null);

  return getDocumentById(id);
}

function getDocumentById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id) || null;
}

function listDocumentsByMatter(matterId) {
  const db = getDb();
  return db.prepare('SELECT * FROM documents WHERE matter_id = ? ORDER BY updated_at DESC').all(matterId);
}

function updateDocument(id, updates) {
  const db = getDb();
  const sets = [];
  const values = [];

  if (updates.title !== undefined) { sets.push('title = ?'); values.push(updates.title); }
  if (updates.content_json !== undefined) {
    sets.push('content_json = ?');
    values.push(typeof updates.content_json === 'string' ? updates.content_json : JSON.stringify(updates.content_json));
  }
  if (updates.status !== undefined) { sets.push('status = ?'); values.push(updates.status); }

  if (sets.length === 0) return getDocumentById(id);

  sets.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE documents SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getDocumentById(id);
}

function deleteDocument(id) {
  const db = getDb();
  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
}

export { createDocument, getDocumentById, listDocumentsByMatter, updateDocument, deleteDocument };

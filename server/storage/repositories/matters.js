/**
 * Equal Scales — Matters Repository
 *
 * CRUD operations for matter records in SQLite.
 * Matters belong to a client and represent a legal engagement or workstream.
 */

import { getDb } from '../db.js';
import crypto from 'crypto';

function generateId() {
  return 'matter_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Create a new matter under a client. Returns the created record.
 */
function createMatter({ clientId, name, matterType = null, status = 'active' }) {
  const db = getDb();
  const id = generateId();
  let slug = slugify(name);

  // Disambiguate slug if it already exists for this client
  const existing = db.prepare('SELECT COUNT(*) as count FROM matters WHERE client_id = ? AND slug = ?').get(clientId, slug);
  if (existing.count > 0) {
    slug = slug + '-' + crypto.randomBytes(3).toString('hex');
  }

  const stmt = db.prepare(`
    INSERT INTO matters (id, client_id, slug, name, matter_type, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, clientId, slug, name, matterType, status);

  return getMatterById(id);
}

/**
 * Get a matter by ID.
 */
function getMatterById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM matters WHERE id = ?').get(id) || null;
}

/**
 * List all matters for a client.
 */
function listMattersByClient(clientId, { status = null } = {}) {
  const db = getDb();
  if (status) {
    return db.prepare('SELECT * FROM matters WHERE client_id = ? AND status = ? ORDER BY name')
      .all(clientId, status);
  }
  return db.prepare('SELECT * FROM matters WHERE client_id = ? ORDER BY name').all(clientId);
}

/**
 * Update a matter's fields.
 */
function updateMatter(id, updates) {
  const db = getDb();
  const allowed = ['name', 'matter_type', 'status', 'matter_path'];
  const sets = [];
  const values = [];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (sets.length === 0) return getMatterById(id);

  sets.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE matters SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getMatterById(id);
}

export { createMatter, getMatterById, listMattersByClient, updateMatter };

/**
 * Equal Scales — Clients Repository
 *
 * CRUD operations for client records in SQLite.
 * Does NOT handle filesystem operations (vault directories).
 * Filesystem concerns belong in vault-service (Phase 2).
 */

import { getDb } from '../db.js';
import crypto from 'crypto';

function generateId() {
  return 'client_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Create a new client. Returns the created client record.
 */
function createClient({ name, displayName = null, status = 'active' }) {
  const db = getDb();
  const id = generateId();
  let slug = slugify(name);

  // Disambiguate slug if it already exists (e.g. two "John Smith" clients)
  const existing = db.prepare('SELECT COUNT(*) as count FROM clients WHERE slug = ?').get(slug);
  if (existing.count > 0) {
    slug = slug + '-' + crypto.randomBytes(3).toString('hex');
  }

  const stmt = db.prepare(`
    INSERT INTO clients (id, slug, name, display_name, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, slug, name, displayName || name, status);

  return getClientById(id);
}

/**
 * Get a client by ID.
 */
function getClientById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id) || null;
}

/**
 * Get a client by slug.
 */
function getClientBySlug(slug) {
  const db = getDb();
  return db.prepare('SELECT * FROM clients WHERE slug = ?').get(slug) || null;
}

/**
 * List all clients, optionally filtered by status.
 */
function listClients({ status = null } = {}) {
  const db = getDb();
  if (status) {
    return db.prepare('SELECT * FROM clients WHERE status = ? ORDER BY name').all(status);
  }
  return db.prepare('SELECT * FROM clients ORDER BY name').all();
}

/**
 * Update a client's fields. Only updates provided fields.
 */
function updateClient(id, updates) {
  const db = getDb();
  const allowed = ['name', 'display_name', 'status', 'root_path'];
  const sets = [];
  const values = [];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (sets.length === 0) return getClientById(id);

  sets.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE clients SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getClientById(id);
}

export { createClient, getClientById, getClientBySlug, listClients, updateClient };

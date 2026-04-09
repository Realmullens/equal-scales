/**
 * Equal Scales — Templates Repository
 *
 * CRUD operations for template metadata in SQLite.
 * Template files live on disk; this tracks their metadata.
 */

import { getDb } from '../db.js';
import crypto from 'crypto';

function generateId() {
  return 'tmpl_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

/**
 * Register a template in the database. Returns the created record.
 */
function createTemplate({
  slug,
  name,
  templateType = null,
  description = null,
  fileFormat = 'markdown',
  sourcePath,
  placeholders = [],
  tags = []
}) {
  const db = getDb();
  const id = generateId();

  const stmt = db.prepare(`
    INSERT INTO templates (id, slug, name, template_type, description, file_format, source_path, placeholders_json, tags_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id, slug, name, templateType, description, fileFormat, sourcePath,
    JSON.stringify(placeholders),
    JSON.stringify(tags)
  );

  return getTemplateById(id);
}

/**
 * Get a template by ID.
 */
function getTemplateById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM templates WHERE id = ?').get(id) || null;
}

/**
 * Get a template by slug.
 */
function getTemplateBySlug(slug) {
  const db = getDb();
  return db.prepare('SELECT * FROM templates WHERE slug = ?').get(slug) || null;
}

/**
 * List all templates, optionally filtered by type.
 */
function listTemplates({ templateType = null } = {}) {
  const db = getDb();
  if (templateType) {
    return db.prepare('SELECT * FROM templates WHERE template_type = ? ORDER BY name')
      .all(templateType);
  }
  return db.prepare('SELECT * FROM templates ORDER BY template_type, name').all();
}

/**
 * Update a template's metadata.
 */
function updateTemplate(id, updates) {
  const db = getDb();
  const allowed = ['name', 'template_type', 'description', 'file_format', 'source_path'];
  const sets = [];
  const values = [];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  // Handle JSON fields separately
  if (updates.placeholders !== undefined) {
    sets.push('placeholders_json = ?');
    values.push(JSON.stringify(updates.placeholders));
  }
  if (updates.tags !== undefined) {
    sets.push('tags_json = ?');
    values.push(JSON.stringify(updates.tags));
  }

  if (sets.length === 0) return getTemplateById(id);

  sets.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE templates SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getTemplateById(id);
}

export { createTemplate, getTemplateById, getTemplateBySlug, listTemplates, updateTemplate };

/**
 * Equal Scales — Conversations & Messages Repository
 *
 * CRUD operations for conversations and their messages.
 * Conversations can be linked to a client and/or matter for scoped context.
 * Messages are append-only within a conversation.
 */

import { getDb } from '../db.js';
import crypto from 'crypto';

function generateId(prefix) {
  return prefix + '_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
}

// ---- Conversations ----

/**
 * Create a new conversation. Returns the created record.
 */
function createConversation({
  clientId = null,
  matterId = null,
  title = null,
  provider = null,
  providerSessionId = null
}) {
  const db = getDb();
  const id = generateId('conv');

  // Enforce: if matter is specified, it must belong to the same client
  if (matterId && clientId) {
    const matter = db.prepare('SELECT client_id FROM matters WHERE id = ?').get(matterId);
    if (!matter) throw new Error(`Matter ${matterId} not found`);
    if (matter.client_id !== clientId) {
      throw new Error(`Matter ${matterId} belongs to a different client — cross-client conversation linking is not allowed`);
    }
  }

  const stmt = db.prepare(`
    INSERT INTO conversations (id, client_id, matter_id, title, provider, provider_session_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, clientId, matterId, title, provider, providerSessionId);

  return getConversationById(id);
}

/**
 * Get a conversation by ID.
 */
function getConversationById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) || null;
}

/**
 * List conversations, optionally scoped to a client and/or matter.
 */
function listConversations({ clientId = null, matterId = null } = {}) {
  const db = getDb();
  let query = 'SELECT * FROM conversations WHERE 1=1';
  const params = [];

  if (clientId) {
    query += ' AND client_id = ?';
    params.push(clientId);
  }
  if (matterId) {
    query += ' AND matter_id = ?';
    params.push(matterId);
  }

  query += ' ORDER BY updated_at DESC';
  return db.prepare(query).all(...params);
}

/**
 * Update a conversation (e.g. title, provider session).
 */
function updateConversation(id, updates) {
  const db = getDb();
  const allowed = ['title', 'provider', 'provider_session_id', 'client_id', 'matter_id'];
  const sets = [];
  const values = [];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }

  if (sets.length === 0) return getConversationById(id);

  sets.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE conversations SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getConversationById(id);
}

// ---- Messages ----

/**
 * Add a message to a conversation. Returns the created record.
 */
function addMessage({ conversationId, role, content, metadata = null }) {
  const db = getDb();
  const id = generateId('msg');

  const stmt = db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content, metadata_json)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, conversationId, role, content, metadata ? JSON.stringify(metadata) : null);

  // Touch the conversation's updated_at
  db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?")
    .run(conversationId);

  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
}

/**
 * Get all messages for a conversation, ordered chronologically.
 */
function getMessages(conversationId) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, rowid ASC'
  ).all(conversationId);
}

export {
  createConversation,
  getConversationById,
  listConversations,
  updateConversation,
  addMessage,
  getMessages
};

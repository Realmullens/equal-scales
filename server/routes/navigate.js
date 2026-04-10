/**
 * Equal Scales — Navigation Routes
 *
 * Supports chat-driven workspace navigation (OUTCOME-F1, F2).
 * The agent or user can search for clients, matters, and drafts
 * by name to navigate the workspace.
 *
 * GET /api/navigate/search?q=...  — fuzzy search across clients, matters, drafts
 */

import { Router } from 'express';
import { getDb } from '../storage/db.js';

const router = Router();

/**
 * Search across clients, matters, and drafts by name.
 * Returns matched entities with enough info to navigate to them.
 */
router.get('/search', (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Search query (q) is required' });
  }

  const query = `%${q.trim()}%`;
  const db = getDb();

  try {
    const clients = db.prepare(
      "SELECT id, name, display_name, status, root_path FROM clients WHERE name LIKE ? OR display_name LIKE ? ORDER BY name LIMIT 10"
    ).all(query, query).map(c => ({ ...c, type: 'client' }));

    const matters = db.prepare(
      `SELECT m.id, m.name, m.matter_type, m.status, m.matter_path, m.client_id,
              c.name as client_name, c.display_name as client_display_name
       FROM matters m JOIN clients c ON m.client_id = c.id
       WHERE m.name LIKE ? ORDER BY m.name LIMIT 10`
    ).all(query).map(m => ({ ...m, type: 'matter' }));

    const drafts = db.prepare(
      `SELECT d.id, d.title, d.version, d.status, d.file_path, d.client_id, d.matter_id,
              c.name as client_name, m.name as matter_name
       FROM drafts d
       JOIN clients c ON d.client_id = c.id
       LEFT JOIN matters m ON d.matter_id = m.id
       WHERE d.title LIKE ? ORDER BY d.updated_at DESC LIMIT 10`
    ).all(query).map(d => ({ ...d, type: 'draft' }));

    res.json({ results: [...clients, ...matters, ...drafts] });
  } catch (err) {
    console.error('[Navigate] Search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

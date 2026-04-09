/**
 * Equal Scales — Matter Routes
 *
 * REST endpoints for matter CRUD.
 * POST /          — create a new matter (requires clientId in body)
 * GET /           — list matters (requires clientId query param)
 * GET /:id        — get a single matter
 */

import { Router } from 'express';
import { createMatter, getMatterById, listMattersByClient, updateMatter } from '../storage/repositories/matters.js';
import { getClientById } from '../storage/repositories/clients.js';
import { createMatterVault } from '../services/vault-service.js';

const router = Router();

// Create a new matter under a client
router.post('/', (req, res) => {
  const { clientId, name, matterType } = req.body;

  if (!clientId) {
    return res.status(400).json({ error: 'clientId is required' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Matter name is required' });
  }

  try {
    // Verify client exists
    const client = getClientById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const matter = createMatter({
      clientId,
      name: name.trim(),
      matterType: matterType?.trim() || null
    });

    // Create vault directory + starter files (best-effort)
    const vaultPath = createMatterVault(client, matter);
    if (vaultPath) {
      updateMatter(matter.id, { matter_path: vaultPath });
      matter.matter_path = vaultPath;
    }

    console.log('[Matters] Created:', matter.id, matter.name, 'under', client.name);
    res.status(201).json(matter);
  } catch (err) {
    console.error('[Matters] Create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// List matters for a client
router.get('/', (req, res) => {
  const { clientId, status } = req.query;

  if (!clientId) {
    return res.status(400).json({ error: 'clientId query parameter is required' });
  }

  try {
    const matters = listMattersByClient(clientId, { status: status || null });
    res.json(matters);
  } catch (err) {
    console.error('[Matters] List error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get a single matter
router.get('/:id', (req, res) => {
  try {
    const matter = getMatterById(req.params.id);
    if (!matter) {
      return res.status(404).json({ error: 'Matter not found' });
    }
    res.json(matter);
  } catch (err) {
    console.error('[Matters] Get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

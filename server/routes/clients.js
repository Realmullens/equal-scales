/**
 * Equal Scales — Client Routes
 *
 * REST endpoints for client CRUD.
 * POST /          — create a new client
 * GET /           — list all clients
 * GET /:id        — get a single client
 */

import { Router } from 'express';
import { createClient, getClientById, listClients, updateClient } from '../storage/repositories/clients.js';
import { createClientVault } from '../services/vault-service.js';

const router = Router();

// Create a new client
router.post('/', (req, res) => {
  const { name, displayName } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Client name is required' });
  }

  try {
    const client = createClient({ name: name.trim(), displayName: displayName?.trim() });

    // Create vault directory + starter files (best-effort)
    const vaultPath = createClientVault(client);
    if (vaultPath) {
      updateClient(client.id, { root_path: vaultPath });
      client.root_path = vaultPath;
    }

    console.log('[Clients] Created:', client.id, client.name);
    res.status(201).json(client);
  } catch (err) {
    console.error('[Clients] Create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// List all clients
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    const clients = listClients({ status: status || null });
    res.json(clients);
  } catch (err) {
    console.error('[Clients] List error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get a single client
router.get('/:id', (req, res) => {
  try {
    const client = getClientById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (err) {
    console.error('[Clients] Get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

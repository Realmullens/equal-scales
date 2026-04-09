/**
 * Equal Scales — Template Routes
 *
 * REST endpoints for the template library.
 * GET /           — list all templates (optionally filter by type)
 * GET /:id        — get a single template with full body content
 * POST /sync      — rescan templates directory and sync to DB
 */

import { Router } from 'express';
import { listTemplates } from '../storage/repositories/templates.js';
import { syncTemplates, getTemplateWithBody } from '../services/template-service.js';

const router = Router();

// List all templates
router.get('/', (req, res) => {
  try {
    const { type } = req.query;
    const templates = listTemplates({ templateType: type || null });
    res.json(templates);
  } catch (err) {
    console.error('[Templates] List error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get a single template with body content
router.get('/:id', (req, res) => {
  try {
    const template = getTemplateWithBody(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (err) {
    console.error('[Templates] Get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Rescan templates directory and sync to DB
router.post('/sync', (req, res) => {
  try {
    const results = syncTemplates();
    res.json({ synced: results.length, templates: results });
  } catch (err) {
    console.error('[Templates] Sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

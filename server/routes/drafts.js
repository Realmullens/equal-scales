/**
 * Equal Scales — Draft Routes
 *
 * REST endpoints for draft management.
 * POST /generate-prompt  — build a drafting prompt (returns prompt text for the chat pipeline)
 * POST /save             — save completed draft content to vault + DB
 * GET /                  — list drafts for a client (optionally by matter)
 * GET /:id              — get a single draft with file content
 */

import { Router } from 'express';
import fs from 'fs';
import { buildDraftingPrompt, saveDraft } from '../services/draft-service.js';
import { listDraftsByClient, getDraftById } from '../storage/repositories/drafts.js';

const router = Router();

// Build a drafting prompt from template + context (used by the renderer before sending to chat)
router.post('/generate-prompt', (req, res) => {
  const { templateId, clientId, matterId, instructions } = req.body;

  if (!templateId || !clientId) {
    return res.status(400).json({ error: 'templateId and clientId are required' });
  }

  try {
    const { prompt, template, context } = buildDraftingPrompt({
      templateId,
      clientId,
      matterId: matterId || null,
      instructions: instructions || ''
    });

    res.json({
      prompt,
      templateName: template.name,
      clientName: context.client.display_name || context.client.name,
      matterName: context.matter ? context.matter.name : null
    });
  } catch (err) {
    console.error('[Drafts] Generate prompt error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Save a completed draft
router.post('/save', (req, res) => {
  const { content, templateId, clientId, matterId, title } = req.body;

  if (!content || !clientId) {
    return res.status(400).json({ error: 'content and clientId are required' });
  }

  try {
    const draft = saveDraft({
      content,
      templateId: templateId || null,
      clientId,
      matterId: matterId || null,
      title: title || null
    });

    console.log('[Drafts] Saved:', draft.id, draft.title, 'v' + draft.version);
    res.status(201).json(draft);
  } catch (err) {
    console.error('[Drafts] Save error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// List drafts for a client
router.get('/', (req, res) => {
  const { clientId, matterId, status } = req.query;

  if (!clientId) {
    return res.status(400).json({ error: 'clientId query parameter is required' });
  }

  try {
    const drafts = listDraftsByClient(clientId, {
      matterId: matterId || null,
      status: status || null
    });
    res.json(drafts);
  } catch (err) {
    console.error('[Drafts] List error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get a single draft with file content
router.get('/:id', (req, res) => {
  try {
    const draft = getDraftById(req.params.id);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // Read file content if it exists
    let content = null;
    if (draft.file_path && fs.existsSync(draft.file_path)) {
      content = fs.readFileSync(draft.file_path, 'utf-8');
    }

    res.json({ ...draft, content });
  } catch (err) {
    console.error('[Drafts] Get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

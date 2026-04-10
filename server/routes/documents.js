/**
 * Equal Scales — Document Routes
 *
 * REST endpoints for structured document CRUD.
 * POST /                — create a new document (requires matterId)
 * GET /?matterId=...    — list documents for a matter
 * GET /:id              — get a document with content
 * PUT /:id              — update document content/title
 * DELETE /:id           — delete a document
 */

import { Router } from 'express';
import { createDocument, getDocumentById, listDocumentsByMatter, updateDocument, deleteDocument } from '../storage/repositories/documents.js';
import { getMatterById } from '../storage/repositories/matters.js';

const router = Router();

router.post('/', (req, res) => {
  const { matterId, title, contentJson } = req.body;
  if (!matterId) return res.status(400).json({ error: 'matterId is required' });
  if (!title || !title.trim()) return res.status(400).json({ error: 'title is required' });

  const matter = getMatterById(matterId);
  if (!matter) return res.status(404).json({ error: 'Matter not found' });

  try {
    const doc = createDocument({ matterId, title: title.trim(), contentJson: contentJson || null });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  const { matterId } = req.query;
  if (!matterId) return res.status(400).json({ error: 'matterId query param required' });

  try {
    res.json(listDocumentsByMatter(matterId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const doc = getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
});

router.put('/:id', (req, res) => {
  const doc = getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  try {
    const updated = updateDocument(req.params.id, {
      title: req.body.title,
      content_json: req.body.contentJson,
      status: req.body.status
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const doc = getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  try {
    deleteDocument(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

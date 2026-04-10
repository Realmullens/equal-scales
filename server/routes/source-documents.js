/**
 * Equal Scales — Source Document Routes
 *
 * Attach source documents (PDFs, DOCX, text files) to matters.
 * Files are copied into the matter's source-documents/ vault directory.
 *
 * POST /attach          — attach a file from disk to a matter
 * GET /?matterId=...    — list source docs for a matter
 * GET /:id              — get a single source doc
 * DELETE /:id           — remove a source doc
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { createSourceDocument, getSourceDocumentById, listSourceDocumentsByMatter, deleteSourceDocument } from '../storage/repositories/source-documents.js';
import { getMatterById } from '../storage/repositories/matters.js';

const router = Router();

// Attach a source document to a matter
router.post('/attach', (req, res) => {
  const { matterId, sourcePath, description } = req.body;

  if (!matterId) return res.status(400).json({ error: 'matterId is required' });
  if (!sourcePath) return res.status(400).json({ error: 'sourcePath is required' });

  const matter = getMatterById(matterId);
  if (!matter) return res.status(404).json({ error: 'Matter not found' });
  if (!matter.matter_path) return res.status(400).json({ error: 'Matter has no vault path' });

  // Verify source file exists
  if (!fs.existsSync(sourcePath)) {
    return res.status(404).json({ error: 'Source file not found on disk' });
  }

  try {
    const filename = path.basename(sourcePath);
    const ext = path.extname(filename).toLowerCase().replace('.', '');
    const stat = fs.statSync(sourcePath);

    // Copy file into matter's source-documents directory
    const destDir = path.join(matter.matter_path, 'source-documents');
    fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, filename);
    fs.copyFileSync(sourcePath, destPath);

    // Extract text content for context assembly (text-based files only)
    let contentText = null;
    const textExtensions = ['txt', 'md', 'csv', 'json', 'yaml', 'yml'];
    if (textExtensions.includes(ext)) {
      contentText = fs.readFileSync(destPath, 'utf-8');
    }

    const doc = createSourceDocument({
      matterId,
      filename,
      filePath: destPath,
      fileType: ext,
      fileSize: stat.size,
      description: description || null,
      contentText
    });

    console.log('[SourceDocs] Attached:', filename, 'to matter', matter.name);
    res.status(201).json(doc);
  } catch (err) {
    console.error('[SourceDocs] Attach error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// List source documents for a matter
router.get('/', (req, res) => {
  const { matterId } = req.query;
  if (!matterId) return res.status(400).json({ error: 'matterId query param required' });

  try {
    res.json(listSourceDocumentsByMatter(matterId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single source document
router.get('/:id', (req, res) => {
  const doc = getSourceDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Source document not found' });
  res.json(doc);
});

// Delete a source document
router.delete('/:id', (req, res) => {
  const doc = getSourceDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Source document not found' });

  try {
    // Remove file from disk if it exists
    if (fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }
    deleteSourceDocument(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

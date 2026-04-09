/**
 * Equal Scales — File Browser Routes
 *
 * Provides Finder-like filesystem browsing within the vault.
 * Only serves paths under ~/EqualScalesVault/ — never allows
 * traversal outside the vault root.
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { VAULT_ROOT } from '../storage/paths.js';

const router = Router();

// Separator-aware vault containment check — prevents prefix escapes like EqualScalesVault-backup
function isInsideVault(fullPath) {
  const normalized = path.resolve(fullPath);
  return normalized === VAULT_ROOT || normalized.startsWith(VAULT_ROOT + path.sep);
}

/**
 * GET /api/files?path=<relative-path>
 * List directory contents within the vault.
 * Returns array of { name, type, size, modified, path }.
 */
router.get('/', (req, res) => {
  const relativePath = req.query.path || '';

  // Resolve and validate — must stay within vault
  const fullPath = path.resolve(VAULT_ROOT, relativePath);
  if (!isInsideVault(fullPath)) {
    return res.status(403).json({ error: 'Access denied — path outside vault' });
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Path not found' });
  }

  const stat = fs.statSync(fullPath);

  // If it's a file, return file info + content for text files
  if (stat.isFile()) {
    const ext = path.extname(fullPath).toLowerCase();
    const textExtensions = ['.md', '.txt', '.json', '.yaml', '.yml', '.csv', '.sql'];
    const isText = textExtensions.includes(ext);

    const fileInfo = {
      name: path.basename(fullPath),
      type: 'file',
      size: stat.size,
      modified: stat.mtime.toISOString(),
      path: path.relative(VAULT_ROOT, fullPath),
      extension: ext
    };

    if (isText) {
      fileInfo.content = fs.readFileSync(fullPath, 'utf-8');
    }

    return res.json(fileInfo);
  }

  // Directory listing
  try {
    const entries = fs.readdirSync(fullPath, { withFileTypes: true })
      .filter(entry => !entry.name.startsWith('.') && entry.name !== 'node_modules' && !entry.name.endsWith('.db') && !entry.name.endsWith('.db-shm') && !entry.name.endsWith('.db-wal'))
      .map(entry => {
        const entryPath = path.join(fullPath, entry.name);
        let entryStat;
        try {
          entryStat = fs.statSync(entryPath);
        } catch { return null; }

        const item = {
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: entryStat.size,
          modified: entryStat.mtime.toISOString(),
          path: path.relative(VAULT_ROOT, entryPath)
        };

        if (entry.isFile()) {
          item.extension = path.extname(entry.name).toLowerCase();
        }

        if (entry.isDirectory()) {
          // Count children for folder preview
          try {
            item.childCount = fs.readdirSync(entryPath)
              .filter(c => !c.startsWith('.')).length;
          } catch { item.childCount = 0; }
        }

        return item;
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Directories first, then alphabetical
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    res.json({
      path: path.relative(VAULT_ROOT, fullPath) || '',
      name: path.basename(fullPath) || 'EqualScalesVault',
      entries
    });
  } catch (err) {
    console.error('[Files] List error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create a new directory
router.post('/mkdir', (req, res) => {
  const { path: relativePath } = req.body;
  if (!relativePath) return res.status(400).json({ error: 'path is required' });

  const fullPath = path.resolve(VAULT_ROOT, relativePath);
  if (!isInsideVault(fullPath)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    fs.mkdirSync(fullPath, { recursive: true });
    res.status(201).json({ path: path.relative(VAULT_ROOT, fullPath), created: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a file or empty directory
router.delete('/', (req, res) => {
  const relativePath = req.query.path;
  if (!relativePath) return res.status(400).json({ error: 'path query param required' });

  const fullPath = path.resolve(VAULT_ROOT, relativePath);
  if (!isInsideVault(fullPath) || fullPath === VAULT_ROOT) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmdirSync(fullPath); // only removes empty directories
    } else {
      fs.unlinkSync(fullPath);
    }
    res.json({ deleted: true, path: relativePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

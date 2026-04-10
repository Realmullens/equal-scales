/**
 * Equal Scales — Context Service
 *
 * Gathers scoped context from client and matter workspace files
 * for use in draft generation prompts. Enforces retrieval discipline:
 * matter scope is primary, client context supplements, never unrestricted.
 */

import fs from 'fs';
import path from 'path';
import { getClientById } from '../storage/repositories/clients.js';
import { getMatterById } from '../storage/repositories/matters.js';
import { listSourceDocumentsByMatter } from '../storage/repositories/source-documents.js';

/**
 * Gather context for a draft generation prompt.
 * Returns a structured context object with client and matter information.
 */
function gatherContext({ clientId, matterId = null }) {
  const context = { client: null, matter: null, files: {} };

  // Client context
  const client = getClientById(clientId);
  if (!client) throw new Error(`Client ${clientId} not found`);
  context.client = client;

  if (client.root_path && fs.existsSync(client.root_path)) {
    context.files.profile = readFileIfExists(path.join(client.root_path, 'profile.md'));
    context.files.notes = readFileIfExists(path.join(client.root_path, 'notes.md'));
  }

  // Matter context (if scoped to a matter)
  if (matterId) {
    const matter = getMatterById(matterId);
    if (!matter) throw new Error(`Matter ${matterId} not found`);
    if (matter.client_id !== clientId) {
      throw new Error('Matter does not belong to the specified client');
    }
    context.matter = matter;

    if (matter.matter_path && fs.existsSync(matter.matter_path)) {
      context.files.matter = readFileIfExists(path.join(matter.matter_path, 'matter.md'));
      context.files.facts = readFileIfExists(path.join(matter.matter_path, 'facts.md'));
      context.files.tasks = readFileIfExists(path.join(matter.matter_path, 'tasks.md'));
    }

    // Include source document text content for context assembly
    const sourceDocs = listSourceDocumentsByMatter(matterId);
    context.sourceDocuments = sourceDocs.filter(d => d.content_text);
  }

  return context;
}

/**
 * Build the context section of a drafting prompt from gathered context.
 */
function formatContextForPrompt(context) {
  const parts = [];

  parts.push(`## Client: ${context.client.display_name || context.client.name}`);
  if (context.files.profile) {
    parts.push(`### Client Profile\n${context.files.profile}`);
  }
  if (context.files.notes) {
    parts.push(`### Client Notes\n${context.files.notes}`);
  }

  if (context.matter) {
    parts.push(`## Matter: ${context.matter.name}`);
    if (context.matter.matter_type) {
      parts.push(`**Matter Type:** ${context.matter.matter_type}`);
    }
    if (context.files.matter) {
      parts.push(`### Matter Details\n${context.files.matter}`);
    }
    if (context.files.facts) {
      parts.push(`### Facts\n${context.files.facts}`);
    }
    if (context.files.tasks) {
      parts.push(`### Tasks\n${context.files.tasks}`);
    }
  }

  // Include source document content
  if (context.sourceDocuments && context.sourceDocuments.length > 0) {
    parts.push(`## Source Documents (${context.sourceDocuments.length})`);
    for (const doc of context.sourceDocuments) {
      parts.push(`### ${doc.filename}${doc.description ? ' — ' + doc.description : ''}\n${doc.content_text}`);
    }
  }

  return parts.join('\n\n');
}

function readFileIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8').trim();
    }
  } catch (err) {
    console.error('[Context] Failed to read:', filePath, err.message);
  }
  return null;
}

export { gatherContext, formatContextForPrompt };

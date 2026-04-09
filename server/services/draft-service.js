/**
 * Equal Scales — Draft Service
 *
 * Handles draft generation: builds the drafting prompt from a template
 * and scoped context, saves the resulting draft to the vault, and
 * registers it in SQLite.
 */

import fs from 'fs';
import path from 'path';
import { getTemplateWithBody } from './template-service.js';
import { gatherContext, formatContextForPrompt } from './context-service.js';
import { createDraft, listDraftVersions } from '../storage/repositories/drafts.js';
import { matterDraftsDir, clientDir } from '../storage/paths.js';
import { getClientById } from '../storage/repositories/clients.js';
import { getMatterById } from '../storage/repositories/matters.js';

/**
 * Build the full drafting prompt for the agent.
 * This prompt is sent through the existing chat/SSE pipeline.
 */
function buildDraftingPrompt({ templateId, clientId, matterId = null, instructions = '' }) {
  const template = getTemplateWithBody(templateId);
  if (!template) throw new Error(`Template ${templateId} not found`);
  if (!template.body) throw new Error(`Template ${templateId} has no body content`);

  const context = gatherContext({ clientId, matterId });
  const contextText = formatContextForPrompt(context);
  const placeholders = JSON.parse(template.placeholders_json || '[]');

  const scopeLabel = matterId ? 'matter' : 'client';
  const matterName = context.matter ? context.matter.name : 'None';

  const prompt = `You are drafting a document for Equal Scales.

Current scope:
- Client: ${context.client.display_name || context.client.name}
- Matter: ${matterName}
- Scope level: ${scopeLabel}
- Template: ${template.name}

## Provided Context

${contextText}

## Template to Fill

The following is the template. Fill it using the provided context.

\`\`\`
${template.body}
\`\`\`

## Placeholders to Resolve

${placeholders.length > 0 ? placeholders.map(p => `- {{${p}}}`).join('\n') : 'No explicit placeholders.'}

## Instructions

1. Preserve the template structure unless a section clearly requires rewriting.
2. Fill explicit placeholders where reliable values are present in the provided context.
3. If a placeholder cannot be resolved confidently, leave a clear marker: **[REVIEW REQUIRED: placeholder_name]**
4. Use only the provided client/matter context. Do not infer facts not supported by the context.
5. Keep the output professional and ready for attorney review.
6. If legal-specific uncertainty exists, mark it as **[REVIEW REQUIRED]**.
7. Rewrite [[SECTION:...]] blocks using the provided context where possible.
8. Remove the [[SECTION:...]] and [[/SECTION:...]] markers from the output — they are structural guides only.

${instructions ? `## Additional Instructions from User\n\n${instructions}` : ''}

## Output

Return ONLY the completed draft content. Do not include explanations, preamble, or markdown code fences around the entire output. Start directly with the document content.`;

  return {
    prompt,
    template,
    context
  };
}

/**
 * Save a completed draft to the vault and register it in SQLite.
 * Called after the agent has produced the filled content.
 */
function saveDraft({ content, templateId, clientId, matterId = null, title = null }) {
  const client = getClientById(clientId);
  if (!client) throw new Error(`Client ${clientId} not found`);

  const template = templateId ? getTemplateWithBody(templateId) : null;
  const draftTitle = title || (template ? template.name : 'Untitled Draft');
  const draftType = template ? template.template_type : null;

  // Determine version number
  const existingVersions = listDraftVersions(clientId, draftTitle, { matterId });
  const version = existingVersions.length > 0
    ? Math.max(...existingVersions.map(d => d.version)) + 1
    : 1;

  // Determine save path
  const datePrefix = new Date().toISOString().split('T')[0];
  const slugTitle = draftTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `${datePrefix}-${slugTitle}-v${version}.md`;

  let draftsDir;
  if (matterId) {
    const matter = getMatterById(matterId);
    if (!matter || !matter.matter_path) {
      throw new Error(`Matter ${matterId} has no vault path — cannot save matter-scoped draft`);
    }
    draftsDir = path.join(matter.matter_path, 'drafts');
  } else if (client.root_path) {
    draftsDir = path.join(client.root_path, 'drafts');
  } else {
    throw new Error('Cannot determine draft save location — client has no vault path');
  }

  // Ensure directory exists
  fs.mkdirSync(draftsDir, { recursive: true });

  const filePath = path.join(draftsDir, filename);

  // Register in database FIRST — if FK checks fail, no orphan file is created
  const draft = createDraft({
    clientId,
    matterId,
    templateId,
    title: draftTitle,
    draftType,
    fileFormat: 'markdown',
    filePath,
    version,
    status: 'draft'
  });

  // Write file to disk AFTER DB insert succeeds
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('[Drafts] Saved draft to:', filePath);

  return draft;
}

export { buildDraftingPrompt, saveDraft };

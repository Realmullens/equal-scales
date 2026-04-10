/**
 * Equal Scales — Milestone 2 Slice 02 Verification
 * Drafting API Integration (simulates renderer flow)
 *
 * Tests the exact API call sequence the renderer makes:
 * 1. List clients → select one
 * 2. List matters → select one
 * 3. List templates → select one
 * 4. POST /api/drafts/generate-prompt → get drafting prompt
 * 5. (Agent fills template — skipped, requires Claude SDK)
 * 6. POST /api/drafts/save → save filled draft
 * 7. GET /api/drafts?clientId=...&matterId=... → list drafts
 * 8. GET /api/drafts/:id → reopen draft with content
 *
 * Requires: server running on localhost:3001
 * Usage: cd server && node tests/verify-drafting-api-integration.js
 */

const BASE = 'http://localhost:3001';
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  PASS  ${label}`); passed++; }
  else { console.error(`  FAIL  ${label}`); failed++; }
}

function section(title) { console.log(`\n--- ${title} ---`); }

async function json(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  // ==============================
  // 1. Health check
  // ==============================
  section('Server health');
  const health = await json(`${BASE}/api/health`);
  assert(health.status === 200, 'Server is running');
  assert(health.data.status === 'ok', 'Health check OK');

  // ==============================
  // 2. Create client (renderer: createClientFlow)
  // ==============================
  section('Step 1: Create client');
  const clientRes = await json(`${BASE}/api/clients`, {
    method: 'POST',
    body: JSON.stringify({ name: 'API Test Client', displayName: 'API Test Client' })
  });
  assert(clientRes.status === 201, 'Client created (201)');
  assert(clientRes.data.id, 'Client has ID');
  assert(clientRes.data.root_path, 'Client has vault path');
  const clientId = clientRes.data.id;

  // ==============================
  // 3. List clients (renderer: loadClients)
  // ==============================
  section('Step 2: List clients');
  const clientsRes = await json(`${BASE}/api/clients`);
  assert(clientsRes.status === 200, 'Client list OK');
  assert(clientsRes.data.some(c => c.id === clientId), 'New client in list');

  // ==============================
  // 4. Create matter (renderer: createMatterFlowModal)
  // ==============================
  section('Step 3: Create matter');
  const matterRes = await json(`${BASE}/api/matters`, {
    method: 'POST',
    body: JSON.stringify({ clientId, name: 'API Test Matter', matterType: 'estate' })
  });
  assert(matterRes.status === 201, 'Matter created (201)');
  assert(matterRes.data.matter_path, 'Matter has vault path');
  const matterId = matterRes.data.id;

  // ==============================
  // 5. List matters (renderer: loadMattersForClient)
  // ==============================
  section('Step 4: List matters');
  const mattersRes = await json(`${BASE}/api/matters?clientId=${clientId}`);
  assert(mattersRes.status === 200, 'Matter list OK');
  assert(mattersRes.data.some(m => m.id === matterId), 'New matter in list');

  // ==============================
  // 6. List templates (renderer: loadTemplates)
  // ==============================
  section('Step 5: Browse templates');
  const templatesRes = await json(`${BASE}/api/templates`);
  assert(templatesRes.status === 200, 'Template list OK');
  assert(templatesRes.data.length >= 1, 'At least one template available');
  const template = templatesRes.data.find(t => t.slug === 'simple-will') || templatesRes.data[0];
  assert(template.id, 'Template has ID');

  // ==============================
  // 7. Get template with body (renderer: previewTemplate)
  // ==============================
  section('Step 6: Get template detail');
  const tmplDetailRes = await json(`${BASE}/api/templates/${template.id}`);
  assert(tmplDetailRes.status === 200, 'Template detail OK');
  assert(tmplDetailRes.data.body, 'Template has body content');
  assert(tmplDetailRes.data.body.length > 50, 'Template body is substantial');

  // ==============================
  // 8. Generate drafting prompt (renderer: generateDraftFromTemplate)
  // ==============================
  section('Step 7: Generate drafting prompt');
  const promptRes = await json(`${BASE}/api/drafts/generate-prompt`, {
    method: 'POST',
    body: JSON.stringify({
      templateId: template.id,
      clientId,
      matterId,
      instructions: 'Focus on the executor section.'
    })
  });
  assert(promptRes.status === 200, 'Prompt generation OK');
  assert(promptRes.data.prompt, 'Response contains prompt');
  assert(promptRes.data.prompt.length > 200, 'Prompt is substantial');
  assert(promptRes.data.templateName, 'Response contains template name');
  assert(promptRes.data.clientName === 'API Test Client', 'Response contains correct client name');
  assert(promptRes.data.matterName === 'API Test Matter', 'Response contains correct matter name');

  // ==============================
  // 9. Save draft (renderer: after agent fills, calls saveDraft)
  // ==============================
  section('Step 8: Save draft');
  const draftContent = `# Simple Will for API Test Client\n\nThis is a test draft generated via the API integration flow.\n\nExecutor: Test Executor\n`;
  const saveRes = await json(`${BASE}/api/drafts/save`, {
    method: 'POST',
    body: JSON.stringify({
      content: draftContent,
      clientId,
      matterId,
      templateId: template.id,
      title: template.name
    })
  });
  assert(saveRes.status === 201, 'Draft saved (201)');
  assert(saveRes.data.id, 'Saved draft has ID');
  assert(saveRes.data.version === 1, 'Draft is v1');
  assert(saveRes.data.client_id === clientId, 'Draft linked to client');
  assert(saveRes.data.matter_id === matterId, 'Draft linked to matter');
  assert(saveRes.data.template_id === template.id, 'Draft preserves template origin');
  assert(saveRes.data.file_path, 'Draft has file path');
  const draftId = saveRes.data.id;

  // ==============================
  // 10. List drafts (renderer: loadDrafts)
  // ==============================
  section('Step 9: List drafts');
  const draftsRes = await json(`${BASE}/api/drafts?clientId=${clientId}&matterId=${matterId}`);
  assert(draftsRes.status === 200, 'Draft list OK');
  assert(draftsRes.data.length >= 1, 'At least one draft listed');
  assert(draftsRes.data.some(d => d.id === draftId), 'Saved draft in list');

  // ==============================
  // 11. Reopen draft (renderer: openDraftPreview)
  // ==============================
  section('Step 10: Reopen draft');
  const reopenRes = await json(`${BASE}/api/drafts/${draftId}`);
  assert(reopenRes.status === 200, 'Draft reopen OK');
  assert(reopenRes.data.content, 'Reopened draft has content');
  assert(reopenRes.data.content.includes('API Test Client'), 'Content matches saved draft');
  assert(reopenRes.data.title === template.name, 'Title matches');

  // ==============================
  // 12. Save revision (renderer: reviseDraft → saveDraft v2)
  // ==============================
  section('Step 11: Save revision');
  const revisedContent = draftContent.replace('Test Executor', 'Revised Executor Name');
  const reviseRes = await json(`${BASE}/api/drafts/save`, {
    method: 'POST',
    body: JSON.stringify({
      content: revisedContent,
      clientId,
      matterId,
      templateId: template.id,
      title: template.name
    })
  });
  assert(reviseRes.status === 201, 'Revision saved (201)');
  assert(reviseRes.data.version === 2, 'Revision is v2');

  // Both versions accessible
  const allDrafts = await json(`${BASE}/api/drafts?clientId=${clientId}&matterId=${matterId}`);
  assert(allDrafts.data.length >= 2, 'Both versions listed');

  // ==============================
  // 13. Input validation (renderer error paths)
  // ==============================
  section('Step 12: Input validation');

  const noClient = await json(`${BASE}/api/clients`, {
    method: 'POST', body: JSON.stringify({ name: '' })
  });
  assert(noClient.status === 400, 'Empty client name → 400');

  const noMatterClient = await json(`${BASE}/api/matters`, {
    method: 'POST', body: JSON.stringify({ name: 'x' })
  });
  assert(noMatterClient.status === 400, 'Missing clientId → 400');

  const badClient = await json(`${BASE}/api/matters`, {
    method: 'POST', body: JSON.stringify({ clientId: 'fake', name: 'x' })
  });
  assert(badClient.status === 404, 'Nonexistent client → 404');

  const noPromptTemplate = await json(`${BASE}/api/drafts/generate-prompt`, {
    method: 'POST', body: JSON.stringify({ clientId })
  });
  assert(noPromptTemplate.status === 400, 'Missing templateId → 400');

  const noSaveContent = await json(`${BASE}/api/drafts/save`, {
    method: 'POST', body: JSON.stringify({ clientId })
  });
  assert(noSaveContent.status === 400, 'Missing content → 400');

  // ==============================
  // 14. Finder-first actions (verify endpoints exist)
  // ==============================
  section('Step 13: File browser API');
  const filesRes = await json(`${BASE}/api/files`);
  assert(filesRes.status === 200, 'File browser root OK');
  assert(filesRes.data.entries, 'Root has entries');
  assert(filesRes.data.entries.some(e => e.name === 'clients'), 'clients/ visible');
  assert(filesRes.data.entries.some(e => e.name === 'templates'), 'templates/ visible');
  assert(!filesRes.data.entries.some(e => e.name.endsWith('.db')), 'DB files hidden');

  // ==============================
  // SUMMARY
  // ==============================
  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    console.error('VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('ALL API INTEGRATION TESTS PASSED');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

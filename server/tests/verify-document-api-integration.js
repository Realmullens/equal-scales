/**
 * Equal Scales — Milestone 3 Slice 03 Verification
 * Document API Integration (OUTCOME-C1, C2, C3)
 *
 * Requires: server running on localhost:3001
 * Usage: cd server && node tests/verify-document-api-integration.js
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
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  // Setup
  section('Setup');
  const client = await json(`${BASE}/api/clients`, {
    method: 'POST', body: JSON.stringify({ name: 'DocAPI Integration Client' })
  });
  assert(client.status === 201, 'Client created');
  const clientId = client.data.id;

  const matter = await json(`${BASE}/api/matters`, {
    method: 'POST', body: JSON.stringify({ clientId, name: 'Contract Review', matterType: 'contracts' })
  });
  assert(matter.status === 201, 'Matter created');
  const matterId = matter.data.id;

  // ==============================
  // C1: Document workspace opens (API creates + returns)
  // ==============================
  section('C1: Create and open document');

  const doc = await json(`${BASE}/api/documents`, {
    method: 'POST', body: JSON.stringify({ matterId, title: 'Service Agreement' })
  });
  assert(doc.status === 201, 'Document created (201)');
  assert(doc.data.id, 'Document has ID');
  assert(doc.data.matter_id === matterId, 'Document scoped to matter');
  assert(doc.data.title === 'Service Agreement', 'Title stored');
  assert(doc.data.status === 'draft', 'Default status is draft');
  const docId = doc.data.id;

  // Retrieve
  const fetched = await json(`${BASE}/api/documents/${docId}`);
  assert(fetched.status === 200, 'Document retrievable');
  assert(fetched.data.title === 'Service Agreement', 'Title matches on fetch');

  // ==============================
  // C2: Structured editing (JSON content)
  // ==============================
  section('C2: Structured document content');

  const tiptapContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Service Agreement' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'This ' },
          { type: 'text', marks: [{ type: 'bold' }], text: 'Service Agreement' },
          { type: 'text', text: ' ("Agreement") is entered into as of ' },
          { type: 'text', marks: [{ type: 'italic' }], text: '[Date]' },
          { type: 'text', text: '.' }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '1. Scope of Services' }]
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Legal research and analysis' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Document preparation and review' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Client correspondence' }] }] }
        ]
      },
      {
        type: 'blockquote',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Note: Additional services require written amendment.' }] }]
      }
    ]
  };

  // Save structured content
  const saved = await json(`${BASE}/api/documents/${docId}`, {
    method: 'PUT',
    body: JSON.stringify({ contentJson: tiptapContent })
  });
  assert(saved.status === 200, 'Content saved');
  assert(saved.data.content_json !== null, 'Content JSON stored');

  // Verify structure preserved
  const savedContent = JSON.parse(saved.data.content_json);
  assert(savedContent.type === 'doc', 'Doc type preserved');
  assert(savedContent.content.length === 5, 'All 5 nodes preserved');
  assert(savedContent.content[0].type === 'heading', 'Heading node preserved');
  assert(savedContent.content[0].attrs.level === 1, 'Heading level preserved');
  assert(savedContent.content[1].content[1].marks[0].type === 'bold', 'Bold mark preserved');
  assert(savedContent.content[1].content[3].marks[0].type === 'italic', 'Italic mark preserved');
  assert(savedContent.content[3].type === 'bulletList', 'Bullet list preserved');
  assert(savedContent.content[3].content.length === 3, 'All list items preserved');
  assert(savedContent.content[4].type === 'blockquote', 'Blockquote preserved');

  // ==============================
  // C3: Save and reload round-trip
  // ==============================
  section('C3: Save and reload');

  const reloaded = await json(`${BASE}/api/documents/${docId}`);
  assert(reloaded.status === 200, 'Document reloaded');
  const reloadedContent = JSON.parse(reloaded.data.content_json);
  assert(JSON.stringify(reloadedContent) === JSON.stringify(tiptapContent), 'Content round-trips exactly');
  assert(reloaded.data.matter_id === matterId, 'Matter association preserved');

  // Update content (simulate editing)
  const editedContent = {
    ...tiptapContent,
    content: [
      ...tiptapContent.content,
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '2. Compensation' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Client agrees to pay $500 per hour for services rendered.' }]
      }
    ]
  };

  const edited = await json(`${BASE}/api/documents/${docId}`, {
    method: 'PUT',
    body: JSON.stringify({ contentJson: editedContent })
  });
  assert(edited.status === 200, 'Edit saved');
  const editedParsed = JSON.parse(edited.data.content_json);
  assert(editedParsed.content.length === 7, 'Edited content has 7 nodes');

  // Reload after edit
  const afterEdit = await json(`${BASE}/api/documents/${docId}`);
  assert(JSON.stringify(JSON.parse(afterEdit.data.content_json)) === JSON.stringify(editedContent), 'Edited content round-trips');

  // Update title
  const renamed = await json(`${BASE}/api/documents/${docId}`, {
    method: 'PUT', body: JSON.stringify({ title: 'Amended Service Agreement' })
  });
  assert(renamed.data.title === 'Amended Service Agreement', 'Title update works');

  // Update status
  const activated = await json(`${BASE}/api/documents/${docId}`, {
    method: 'PUT', body: JSON.stringify({ status: 'active' })
  });
  assert(activated.data.status === 'active', 'Status update works');

  // ==============================
  // Matter scoping
  // ==============================
  section('Matter scoping');

  // Create second document
  const doc2 = await json(`${BASE}/api/documents`, {
    method: 'POST', body: JSON.stringify({ matterId, title: 'Engagement Letter' })
  });
  assert(doc2.status === 201, 'Second document created');

  // List by matter
  const matterDocs = await json(`${BASE}/api/documents?matterId=${matterId}`);
  assert(matterDocs.data.length >= 2, 'Both documents in matter list');

  // Different matter — no leakage
  const matter2 = await json(`${BASE}/api/matters`, {
    method: 'POST', body: JSON.stringify({ clientId, name: 'Other Matter' })
  });
  const otherDocs = await json(`${BASE}/api/documents?matterId=${matter2.data.id}`);
  assert(otherDocs.data.length === 0, 'No document leakage to other matter');

  // ==============================
  // Document deletion
  // ==============================
  section('Deletion');

  const tempDoc = await json(`${BASE}/api/documents`, {
    method: 'POST', body: JSON.stringify({ matterId, title: 'Temp Doc' })
  });
  const delRes = await json(`${BASE}/api/documents/${tempDoc.data.id}`, { method: 'DELETE' });
  assert(delRes.data.deleted === true, 'Document deleted');
  const afterDel = await json(`${BASE}/api/documents/${tempDoc.data.id}`);
  assert(afterDel.status === 404, 'Deleted document returns 404');

  // ==============================
  // Input validation
  // ==============================
  section('Validation');

  const noMatter = await json(`${BASE}/api/documents`, {
    method: 'POST', body: JSON.stringify({ title: 'Bad' })
  });
  assert(noMatter.status === 400, 'Missing matterId → 400');

  const noTitle = await json(`${BASE}/api/documents`, {
    method: 'POST', body: JSON.stringify({ matterId })
  });
  assert(noTitle.status === 400, 'Missing title → 400');

  const badMatter = await json(`${BASE}/api/documents`, {
    method: 'POST', body: JSON.stringify({ matterId: 'fake', title: 'Bad' })
  });
  assert(badMatter.status === 404, 'Nonexistent matter → 404');

  const noQuery = await json(`${BASE}/api/documents`);
  assert(noQuery.status === 400, 'List without matterId → 400');

  const notFound = await json(`${BASE}/api/documents/nonexistent`);
  assert(notFound.status === 404, 'Nonexistent document → 404');

  // ==============================
  // Build output verification
  // ==============================
  section('React workspace build');

  const fs = await import('fs');
  const path = await import('path');
  const distDir = path.join(process.cwd(), '..', 'renderer', 'document-dist');
  assert(fs.existsSync(distDir), 'Document workspace dist exists');
  assert(fs.existsSync(path.join(distDir, 'index.html')), 'index.html built');
  const assets = fs.readdirSync(path.join(distDir, 'assets'));
  assert(assets.some(f => f.endsWith('.js')), 'JS bundle exists');

  // ==============================
  // Summary
  // ==============================
  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    console.error('VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('ALL DOCUMENT INTEGRATION TESTS PASSED');
    process.exit(0);
  }
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });

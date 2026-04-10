/**
 * Equal Scales — Milestone 2 Slice 03 Verification
 * Chat-Driven Navigation Search (OUTCOME-F1, F2)
 *
 * Verifies the navigation search API that supports
 * chat-driven workspace navigation.
 *
 * Requires: server running on localhost:3001
 * Usage: cd server && node tests/verify-navigation-search.js
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
  // Setup: create test data
  section('Setup');
  const c1 = await json(`${BASE}/api/clients`, {
    method: 'POST', body: JSON.stringify({ name: 'Navigation Test Corp' })
  });
  assert(c1.status === 201, 'Test client created');
  const clientId = c1.data.id;

  const m1 = await json(`${BASE}/api/matters`, {
    method: 'POST', body: JSON.stringify({ clientId, name: 'Smith Estate Planning', matterType: 'estate' })
  });
  assert(m1.status === 201, 'Test matter created');

  const m2 = await json(`${BASE}/api/matters`, {
    method: 'POST', body: JSON.stringify({ clientId, name: 'Johnson Litigation', matterType: 'litigation' })
  });
  assert(m2.status === 201, 'Second test matter created');

  // Save a draft
  const draft = await json(`${BASE}/api/drafts/save`, {
    method: 'POST', body: JSON.stringify({
      content: '# Demand Letter\nTest content',
      clientId,
      matterId: m2.data.id,
      title: 'Johnson Demand Letter'
    })
  });
  assert(draft.status === 201, 'Test draft saved');

  // ==============================
  // OUTCOME-F1: Search for client by name
  // ==============================
  section('F1: Search for client');

  const clientSearch = await json(`${BASE}/api/navigate/search?q=Navigation`);
  assert(clientSearch.status === 200, 'Client search OK');
  assert(clientSearch.data.results.length >= 1, 'At least one result');
  const clientResult = clientSearch.data.results.find(r => r.type === 'client');
  assert(clientResult !== undefined, 'Client found in results');
  assert(clientResult.name === 'Navigation Test Corp', 'Client name matches');
  assert(clientResult.id === clientId, 'Client ID matches');

  // Partial name search
  const partial = await json(`${BASE}/api/navigate/search?q=Navig`);
  assert(partial.data.results.some(r => r.type === 'client' && r.id === clientId), 'Partial name search works');

  // ==============================
  // OUTCOME-F1: Search for matter by name
  // ==============================
  section('F1: Search for matter');

  const matterSearch = await json(`${BASE}/api/navigate/search?q=Smith`);
  assert(matterSearch.status === 200, 'Matter search OK');
  const matterResult = matterSearch.data.results.find(r => r.type === 'matter');
  assert(matterResult !== undefined, 'Matter found in results');
  assert(matterResult.name === 'Smith Estate Planning', 'Matter name matches');
  assert(matterResult.client_name === 'Navigation Test Corp', 'Matter includes client name');
  assert(matterResult.client_id === clientId, 'Matter includes client_id for navigation');

  // Search for second matter
  const johnsonSearch = await json(`${BASE}/api/navigate/search?q=Johnson`);
  const johnsonMatters = johnsonSearch.data.results.filter(r => r.type === 'matter');
  assert(johnsonMatters.length >= 1, 'Johnson matter found');

  // ==============================
  // OUTCOME-F2: Search for draft by title
  // ==============================
  section('F2: Search for draft');

  const draftSearch = await json(`${BASE}/api/navigate/search?q=Demand`);
  assert(draftSearch.status === 200, 'Draft search OK');
  const draftResult = draftSearch.data.results.find(r => r.type === 'draft');
  assert(draftResult !== undefined, 'Draft found in results');
  assert(draftResult.title === 'Johnson Demand Letter', 'Draft title matches');
  assert(draftResult.client_id === clientId, 'Draft includes client_id');
  assert(draftResult.matter_id === m2.data.id, 'Draft includes matter_id');
  assert(draftResult.version === 1, 'Draft version included');
  assert(draftResult.client_name === 'Navigation Test Corp', 'Draft includes client name');
  assert(draftResult.matter_name === 'Johnson Litigation', 'Draft includes matter name');

  // ==============================
  // Cross-entity search (returns all types)
  // ==============================
  section('Cross-entity search');

  const crossSearch = await json(`${BASE}/api/navigate/search?q=Johnson`);
  const types = new Set(crossSearch.data.results.map(r => r.type));
  assert(types.has('matter'), 'Cross search finds matters');
  assert(types.has('draft'), 'Cross search finds drafts');

  // ==============================
  // Input validation
  // ==============================
  section('Input validation');

  const noQuery = await json(`${BASE}/api/navigate/search`);
  assert(noQuery.status === 400, 'Missing query → 400');

  const emptyQuery = await json(`${BASE}/api/navigate/search?q=`);
  assert(emptyQuery.status === 400, 'Empty query → 400');

  // No results for nonexistent
  const noResults = await json(`${BASE}/api/navigate/search?q=zzzznonexistent`);
  assert(noResults.status === 200, 'Nonexistent query returns 200');
  assert(noResults.data.results.length === 0, 'Zero results for nonexistent');

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
    console.log('ALL NAVIGATION TESTS PASSED');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

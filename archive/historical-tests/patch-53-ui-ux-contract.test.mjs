import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contract = JSON.parse(fs.readFileSync(path.join(root, 'docs/architecture/PATCH-53-UI-UX-CONTRACT.json'), 'utf8'));
const ownership = JSON.parse(fs.readFileSync(path.join(root, 'docs/dictionary/domains/ui-ownership.dictionary.json'), 'utf8'));
const routes = JSON.parse(fs.readFileSync(path.join(root, 'docs/dictionary/domains/routes.dictionary.json'), 'utf8'));

const exists = p => fs.existsSync(path.join(root, p));

test('Patch 53: every frozen page exists and has one owner', () => {
  assert.equal(contract.pages.length, 13);
  for (const page of contract.pages) {
    assert.ok(page.id && page.owner && page.path);
    assert.ok(exists(page.path), `missing page: ${page.path}`);
  }
});

test('Patch 53: frozen route owners agree with route dictionary where routes exist', () => {
  const routeMap = new Map(routes.routes.map(r => [r.path, r]));
  for (const page of contract.pages) {
    const route = routeMap.get(page.path);
    if (route) assert.equal(route.owner, page.owner, `owner mismatch: ${page.path}`);
  }
});

test('Patch 53: canonical high-risk surfaces remain separated', () => {
  const byId = Object.fromEntries(contract.pages.map(p => [p.id, p]));
  assert.equal(byId.market.owner, 'market');
  assert.equal(byId['broker-hq'].owner, 'broker-hq');
  assert.notEqual(byId.market.owner, byId['broker-hq'].owner);
  assert.deepEqual(byId.admin.access, ['admin']);
});

test('Patch 53: existing ownership dictionary retains canonical core surfaces', () => {
  const ids = new Set(ownership.surfaces.map(s => s.id));
  for (const id of ['market', 'broker-hq', 'profile', 'admin', 'auth']) assert.ok(ids.has(id), `missing ownership surface: ${id}`);
});

test('Patch 53: shared primitives have explicit ownership rules', () => {
  for (const primitive of contract.sharedPrimitives) {
    assert.ok(primitive.owner);
    assert.ok(primitive.assets.length > 0);
    assert.ok(primitive.rule);
    for (const asset of primitive.assets) assert.ok(exists(asset), `missing shared asset: ${asset}`);
  }
});

test('Patch 53: named data contracts resolve to executable authority files', () => {
  for (const item of contract.dataContracts) {
    assert.ok(exists(item.authority), `missing authority: ${item.authority}`);
  }
});

test('Patch 53: freeze rules and next gate are explicit', () => {
  assert.ok(contract.freezeRules.length >= 6);
  const next = fs.readFileSync(path.join(root, 'docs/18-ROADMAP.md'), 'utf8');
  assert.match(next, /Sweet Home 3D|camera|roadmap/i);
});

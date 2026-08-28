import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url).pathname;
const projectRoot = new URL('../../', import.meta.url).pathname;
const pages = [
  {page:'market', min:7, manifest:'market-physical-ui-objects.json'},
  {page:'profile', min:12, manifest:'profile-physical-ui-objects.json'}
];

for (const {page,min,manifest:manifestName} of pages) {
  const html = fs.readFileSync(path.join(root, `${page}.html`), 'utf8');
  assert.match(html, /js\/market-profile-physical-ui\.js/);
  assert.match(html, /css\/market-profile-physical-ui\.css/);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, `data/${manifestName}`), 'utf8'));
  assert.ok(manifest.objects.length >= min);
  const ids = new Set();
  for (const object of manifest.objects) {
    assert.ok(!ids.has(object.id), `${page}: duplicate object ${object.id}`);
    ids.add(object.id);
    assert.ok(object.id && object.selector && object.pov && object.animation && object.responsive);
    assert.equal(object.theme ?? 'environment', 'environment');
    assert.equal(object.securityBoundary ?? 'presentation-only', 'presentation-only');
    assert.equal(object.stateContract ?? 'phase12', 'phase12');
  }
}

const matrix = fs.readFileSync(path.join(projectRoot, 'docs/csv/from-app-data/market-profile-physical-ui-root-matrix.csv'),'utf8').trim().split('\n');
assert.equal(matrix.length, 20, 'header + 19 market/profile physical object rows');
console.log('PASS Market/Profile physical UI propagation + root matrix');

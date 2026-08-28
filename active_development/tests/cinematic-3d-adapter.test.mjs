import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const manifest = JSON.parse(fs.readFileSync('data/cinematic-assets.json', 'utf8'));
const adapter = fs.readFileSync('js/reference-3d/cinematic-3d-adapter.js', 'utf8');
const cinematic = fs.readFileSync('js/cinematic-ui.js', 'utf8');

const world = manifest.worlds['world-01-home'];

test('A.2.3 manifest defines the Home World 01 asset contract', () => {
  assert.ok(world);
  for (const slot of ['skyline','residential-district','hero-residence','vehicles','vegetation','architectural-props']) {
    assert.ok(world.slots[slot], `missing ${slot}`);
    assert.equal(world.slots[slot].format[0], 'glb');
  }
});

test('A.2.3 has explicit high and medium performance budgets', () => {
  assert.equal(world.budgets.high.maxTriangles, 2800000);
  assert.equal(world.budgets.medium.maxTriangles, 1010000);
  assert.ok(world.budgets.high.maxTextureMB > world.budgets.medium.maxTextureMB);
});

test('A.2.3 adapter exposes renderer registration and mounting', () => {
  assert.match(adapter, /registerRenderer/);
  assert.match(adapter, /mount\(/);
  assert.match(adapter, /supportsWebGL2/);
  assert.match(adapter, /cinematic-3d-ready/);
});

test('A.2.3 keeps model sources empty until real assets exist', () => {
  for (const slot of Object.values(world.slots)) assert.equal(slot.source, null);
});

test('A.2.3 cinematic runtime calls the adapter without owning the renderer', () => {
  assert.match(cinematic, /window\.hfCinematic3D\?\.mount/);
  assert.match(cinematic, /version: '1\.5\.0-world-a2\.4'/);
});

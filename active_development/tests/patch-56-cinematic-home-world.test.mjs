import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('Patch 56 A.2.1: Home has replaceable layered cinematic slots', () => {
  const js = read('js/cinematic-ui.js');
  const css = read('css/cinematic-ui.css');
  const world = read('data/cinematic-worlds.json');
  assert.match(js, /hf-home-world-layers/);
  assert.match(js, /hf-home-residence/);
  assert.match(css, /hf-home-residence/);
  assert.match(css, /hf-home-skyline/);
  assert.match(css, /hf-home-foreground/);
  assert.match(world, /meshReplacementCompatible/);
});

test('Patch 56 A.2.1: Home prototype has adaptive and reduced-motion behavior', () => {
  const js = read('js/cinematic-ui.js');
  const css = read('css/cinematic-ui.css');
  assert.match(js, /pointerParallax|pointerEnabled/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /max-width: 700px/);
});

test('Patch 56 A.2.1: future architectural asset slots remain represented in the world contract', () => {
  const world = JSON.parse(read('data/cinematic-worlds.json'));
  assert.equal(world.worlds.home.assetStrategy.source, 'SweetHome3D architectural model / future optimized 3D pipeline');
  const slots = world.worlds.home.prototype.meshReplacementSlots;
  for (const key of ['skyline','residential-district','hero-residence','vehicles','vegetation','architectural-props']) {
    assert.ok(slots.includes(key), key);
  }
});

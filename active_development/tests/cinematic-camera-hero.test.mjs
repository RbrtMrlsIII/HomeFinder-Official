import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const root = new URL('..', import.meta.url).pathname;
const read = (file) => fs.readFileSync(`${root}/${file}`, 'utf8');

test('Patch 57 A.2.2: Home has one shared cinematic camera loop', () => {
  const js = read('js/cinematic-ui.js');
  assert.match(js, /HOME_LOOP_MS\s*=\s*22000/);
  assert.match(js, /cinematic-orbit/);
  assert.match(js, /--hf-camera-x/);
  assert.match(js, /requestAnimationFrame\(animateLayers\)/);
});

test('Patch 57 A.2.2: Home hero declares a cinematic focal contract', () => {
  const html = read('index.html');
  assert.match(html, /data-cinematic-anchor="hero"/);
  assert.match(html, /data-cinematic-focal="hero-residence"/);
  assert.match(html, /hf-home-cinematic-hero/);
});

test('Patch 57 A.2.2: Home uses the clean cinematic visual without baked UI', () => {
  const world = read('data/cinematic-worlds.json');
  const scenes = read('data/cinematic-scenes.json');
  assert.doesNotMatch(world, /world01-(?:clean-cinematic|poster|concept)\.png/);
  assert.doesNotMatch(scenes, /world01-(?:clean-cinematic|poster|concept)\.png/);
});

test('Patch 57 A.2.2: reduced motion and mobile composition are explicit', () => {
  const css = read('css/cinematic-ui.css');
  assert.match(css, /@media \(max-width: 768px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /hfHomeHeroReveal/);
});

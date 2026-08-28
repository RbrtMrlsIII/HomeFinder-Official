import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exists = p => fs.existsSync(path.join(root, p));
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const pages = [
  'index.html','login.html','register.html','market.html','profile.html',
  'broker-hq.html','admin.html','staff.html','moderator.html','financing.html',
  'privacy.html','terms.html','verify/index.html'
];

test('Patch 54 Phase A: cinematic runtime and style foundation exist', () => {
  assert.ok(exists('js/cinematic-ui.js'));
  assert.ok(exists('css/cinematic-ui.css'));
  assert.ok(exists('data/cinematic-scenes.json'));
});

test('Patch 54 Phase A: every frozen page mounts the same cinematic runtime', () => {
  for (const page of pages) {
    const html = read(page);
    const expected = page === 'verify/index.html' ? '../js/cinematic-ui.js' : 'js/cinematic-ui.js';
    assert.match(html, new RegExp(`src=["']${expected.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}["']`), `missing cinematic runtime: ${page}`);
  }
});

test('Patch 54 Phase A: legacy transition no longer creates a competing overlay or click router', () => {
  const transition = read('js/transition.js');
  assert.doesNotMatch(transition, /new div\(['"]div['"]\)/);
  assert.doesNotMatch(transition, /document\.addEventListener\(["']click["']/);
  assert.match(transition, /hf:cinematic-ready/);
});

test('Patch 54 Phase A: dirty state has one visual confirmation owner', () => {
  const guard = read('js/leave-guard.js');
  const cinematic = read('js/cinematic-ui.js');
  assert.doesNotMatch(guard, /window\.confirm/);
  assert.match(guard, /beforeunload/);
  assert.match(cinematic, /isDirty/);
  assert.match(cinematic, /data-no-leave-confirm/);
});

test('Patch 54 Phase A: runtime exposes performance tier and ready event', () => {
  const cinematic = read('js/cinematic-ui.js');
  assert.match(cinematic, /tier/);
  assert.match(cinematic, /prefers-reduced-motion/);
  assert.match(cinematic, /hf:cinematic-ready/);
  assert.match(cinematic, /visibilitychange/);
});

test('Patch 54 Phase A: scene catalog remains the page-owned visual source', () => {
  const scenes = JSON.parse(read('data/cinematic-scenes.json'));
  for (const key of ['home','market','profile','broker','admin','staff','moderator','auth','financing','legal']) {
    assert.ok(scenes.scenes[key], `missing scene: ${key}`);
    assert.ok(scenes.scenes[key].media);
    assert.ok(scenes.scenes[key].hero);
  }
});

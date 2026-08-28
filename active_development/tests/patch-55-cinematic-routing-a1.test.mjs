import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('Patch 55 A.1: door routing has explicit enter/exit timing', () => {
  const js = read('js/cinematic-ui.js');
  assert.match(js, /DOOR_OPEN_MS\s*=\s*reduced\s*\?\s*0\s*:\s*1040/);
  assert.match(js, /DOOR_EXIT_MS\s*=\s*reduced\s*\?\s*0\s*:\s*760/);
  assert.match(js, /is-closing/);
  assert.match(js, /is-closed/);
});

test('Patch 55 A.1: exit confirmation is keyboard accessible', () => {
  const js = read('js/cinematic-ui.js');
  assert.match(js, /role','dialog/);
  assert.match(js, /aria-modal/);
  assert.match(js, /Escape/);
  assert.match(js, /e\.key !== 'Tab'/);
  assert.match(js, /preventScroll/);
});

test('Patch 55 A.1: door has atmospheric depth layer', () => {
  const js = read('js/cinematic-ui.js');
  const css = read('css/cinematic-ui.css');
  assert.match(js, /hf-door-atmosphere/);
  assert.match(css, /\.hf-door-atmosphere/);
  assert.match(css, /is-opening \.hf-door-atmosphere/);
});

test('Patch 55 A.1: reduced motion bypasses cinematic movement', () => {
  const js = read('js/cinematic-ui.js');
  const css = read('css/cinematic-ui.css');
  assert.match(js, /if \(reduced\)/);
  assert.match(css, /prefers-reduced-motion/);
});

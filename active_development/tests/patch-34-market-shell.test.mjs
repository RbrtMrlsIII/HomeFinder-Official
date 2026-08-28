import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../market.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../css/market.css', import.meta.url), 'utf8');

const requiredIds = [
  'market-main',
  'market-map-shell',
  'market-map-topbar',
  'market-filters',
  'market-map-canvas',
  'market-map',
  'market-map-toolbar',
  'preferred-radius-host',
  'market-discovery-rail',
  'market-card-rail',
  'market-card-modal'
];

for (const id of requiredIds) {
  const count = (html.match(new RegExp(`id=["']${id}["']`, 'g')) || []).length;
  assert.equal(count, 1, `Expected exactly one #${id}, found ${count}`);
}

assert.match(html, /id="market-main"[^>]*data-shell-version="34"/);
for (const zone of ['orientation','workspace','command','refinement','map','map-actions','radius','results','support']) {
  assert.match(html, new RegExp(`data-shell-zone="${zone}"`), `Missing shell zone: ${zone}`);
}

assert.match(css, /Patch 34 — Market HQ shell contract/);
assert.match(css, /\.market-main\[data-shell-version="34"\]/);
assert.match(html, /js\/market\.js\?v=/);
assert.match(html, /js\/market-chrome\.js/);

console.log('Patch 34 Market HQ shell checks passed.');

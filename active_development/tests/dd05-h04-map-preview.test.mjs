import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

const map = JSON.parse(fs.readFileSync(new URL('../data/main-hall-cinematic-ui-map.json', import.meta.url), 'utf8'));
const bySection = Object.fromEntries(map.sections.map(s => [s.section, s]));

assert.equal(bySection.properties.zone, 'H-03');
assert.equal(bySection.properties.next, 'government-housing');
assert.equal(bySection.map.zone, 'H-04');
assert.equal(bySection.map.next, 'properties');
assert.equal(bySection.map.object_id, 'home-map-table');
assert.equal(bySection.map.response, 'idle/loading/pin-confirm/login-required/market-fallback/error');

test('DD05 H-04 map preview transition contract', () => {
  assert.equal(bySection.properties.next, 'government-housing');
  assert.equal(bySection.map.next, 'properties');
});

console.log('PASS dd05-h04-map-preview');

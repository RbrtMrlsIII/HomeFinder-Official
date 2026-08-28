import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const map = JSON.parse(fs.readFileSync(`${root}data/main-hall-cinematic-ui-map.json`, 'utf8'));
const contract = JSON.parse(fs.readFileSync(`${root}data/main-hall-camera-object-contract.json`, 'utf8'));
const phase13 = JSON.parse(fs.readFileSync(`${root}data/main-hall-camera-contract-phase13.json`, 'utf8'));

const mapped = map.sections.map(s => s.section);
const expectedZones = new Set(['H-01','H-02','H-03','H-04','H-05','H-06','H-07','H-08','H-09']);
assert.equal(map.room, 'MAIN HALL');
assert.equal(map.route, 'index.html');
assert.equal(phase13.master, 'master/HomeFinder.sh3d');
assert.equal(contract.camera_security_boundary, 'presentation-only');
assert.deepEqual(new Set(phase13.povs.map(p => p.pov)), expectedZones);
for (const pov of phase13.povs) {
  assert.ok(contract.povs[pov.pov], `current camera contract missing ${pov.pov}`);
  assert.equal(pov.security, 'presentation-only');
}
assert.equal(mapped.length, 16);
assert.equal(map.sections.find(s => s.section === 'map').next, 'properties');
assert.equal(map.sections.find(s => s.section === 'properties').next, 'government-housing');
console.log('PASS: DD05 Main Hall sequence/current authority reconciliation');

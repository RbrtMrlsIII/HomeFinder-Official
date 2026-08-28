import assert from 'node:assert/strict';
import fs from 'node:fs';

const map = JSON.parse(fs.readFileSync(new URL('../data/main-hall-cinematic-ui-map.json', import.meta.url), 'utf8'));
const objects = JSON.parse(fs.readFileSync(new URL('../data/physical-ui-objects.json', import.meta.url), 'utf8'));
const contract = JSON.parse(fs.readFileSync(new URL('../data/main-hall-camera-object-contract.json', import.meta.url), 'utf8'));

assert.equal(map.room, 'MAIN HALL');
assert.equal(map.route, 'index.html');
assert.equal(map.sections.length, 16);
assert.deepEqual(new Set(map.sections.map(s => s.zone)), new Set(['H-01','H-02','H-03','H-04','H-05','H-06','H-07','H-08','H-09']));

const objectIds = new Set(objects.objects.map(o => o.id));
const povIds = new Set(Object.keys(contract.povs));
for (const s of map.sections) {
  assert.ok(povIds.has(s.zone), `missing current POV ${s.zone}`);
  assert.ok(objectIds.has(s.object_id), `missing current physical UI object ${s.object_id}`);
  assert.ok(s.camera_anchor, `missing camera anchor for ${s.section}`);
  assert.ok(s.response, `missing response mapping for ${s.section}`);
}
assert.equal(contract.camera_security_boundary, 'presentation-only');
console.log('PASS: DD05 Main Hall cinematic map/current physical authority');

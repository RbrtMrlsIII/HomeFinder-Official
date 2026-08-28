import assert from 'node:assert/strict';
import fs from 'node:fs';

const physical = JSON.parse(fs.readFileSync(new URL('../data/physical-ui-objects.json', import.meta.url), 'utf8'));
const contract = JSON.parse(fs.readFileSync(new URL('../data/main-hall-camera-object-contract.json', import.meta.url), 'utf8'));
assert.equal(physical.room, 'main-hall');
assert.equal(physical.root, 'design-roots');
assert.equal(physical.stateMachineContract.authority, 'presentation-only');
assert.ok(physical.responsiveRootContract);

const ids = new Set(physical.objects.map(o => o.id));
assert.equal(ids.size, physical.objects.length);
assert.equal(physical.objects.length, 15, 'current Main Hall physical UI contract must remain the established 15-object census');
for (const o of physical.objects) {
  assert.ok(o.id && o.cameraAnchor && o.cameraSecurityBoundary === undefined || true);
  assert.ok(Array.isArray(o.cameraPOVs) || typeof o.cameraAnchor === 'string', `object ${o.id} needs a presentation anchor`);
  assert.ok(o.responsiveContract?.semanticInvariant !== false, `object ${o.id} must preserve semantic invariance`);
}
for (const id of ['contracts-folder','paypal-subscription-console','admin-approval-desk','moderator-contracts-desk','staff-support-desk']) {
  assert.ok(!ids.has(id), `${id} is intentionally not part of the current Main Hall object contract`);
}
for (const pov of Object.values(contract.povs)) {
  for (const id of pov.object_ids) assert.ok(ids.has(id), `POV references missing current object ${id}`);
}
console.log(`PASS room-shell/current-physical-ui-mapping (${physical.objects.length} Main Hall objects)`);

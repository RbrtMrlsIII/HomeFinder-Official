import assert from 'node:assert/strict';
import fs from 'node:fs';

const map = JSON.parse(fs.readFileSync(new URL('../data/main-hall-cinematic-ui-map.json', import.meta.url), 'utf8'));
const ui = JSON.parse(fs.readFileSync(new URL('../data/ui-response-mapping.json', import.meta.url), 'utf8'));
const physical = JSON.parse(fs.readFileSync(new URL('../data/physical-ui-objects.json', import.meta.url), 'utf8'));
const contract = JSON.parse(fs.readFileSync(new URL('../data/main-hall-camera-object-contract.json', import.meta.url), 'utf8'));

const about = map.sections.find(s => s.section === 'about' && s.zone === 'H-06');
const mission = map.sections.find(s => s.section === 'mission' && s.zone === 'H-06');
assert.ok(about && mission);
assert.equal(about.object_id, 'mission-wall');
assert.equal(mission.object_id, 'mission-wall');
assert.equal(about.response, 'idle/focus/read');
assert.equal(mission.response, 'idle/focus/read');
assert.equal(about.next, 'mission');
assert.equal(mission.next, 'spaces');

const surface = ui.surfaces.find(s => s.surface_id === 'main-hall/about---mission---guide---contact---footer');
assert.ok(surface);
assert.ok(surface.response_states.success.includes('read static content'));
assert.match(surface.action_notes.join(' '), /no backend mutation/);
assert.match(surface.action_notes.join(' '), /HTML content remains authoritative/);

const object = physical.objects.find(o => o.id === 'mission-wall');
assert.ok(object);
assert.deepEqual(contract.povs['H-06'].object_ids, ['mission-wall']);
assert.equal(object.cameraSecurityBoundary, 'presentation-only');
console.log('DD05 H-06 Mission/About mapping/current authority: PASS');

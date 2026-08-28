import assert from 'node:assert/strict';
import fs from 'node:fs';

const map = JSON.parse(fs.readFileSync(new URL('../data/main-hall-cinematic-ui-map.json', import.meta.url), 'utf8'));
const physical = JSON.parse(fs.readFileSync(new URL('../data/physical-ui-objects.json', import.meta.url), 'utf8'));
const contract = JSON.parse(fs.readFileSync(new URL('../data/main-hall-camera-object-contract.json', import.meta.url), 'utf8'));

const section = map.sections.find((s) => s.section === 'government-housing');
assert.ok(section);
assert.equal(section.zone, 'H-05');
assert.equal(section.object_id, 'government-info-desk');
assert.equal(section.ui_mount, 'home-government');
assert.equal(section.next, 'about');
for (const state of ['loading', 'published', 'empty', 'error', 'disclaimer']) assert.ok(section.response.includes(state));
assert.ok(section.transition.includes('guide-handoff'));

const object = physical.objects.find((o) => o.id === 'government-info-desk');
assert.ok(object);
assert.equal(object.cameraPOVs.includes('H-05'), true);
assert.equal(object.cameraSecurityBoundary, 'presentation-only');
assert.equal(contract.povs['H-05'].object_ids[0], 'government-info-desk');
console.log('PASS: DD05 H-05 Government Housing response mapping against current authority');

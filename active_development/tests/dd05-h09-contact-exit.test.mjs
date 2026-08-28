import assert from 'node:assert/strict';
import fs from 'node:fs';

const map = JSON.parse(fs.readFileSync(new URL('../data/main-hall-cinematic-ui-map.json', import.meta.url), 'utf8'));
const physical = JSON.parse(fs.readFileSync(new URL('../data/physical-ui-objects.json', import.meta.url), 'utf8'));
const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const contract = JSON.parse(fs.readFileSync(new URL('../data/main-hall-camera-object-contract.json', import.meta.url), 'utf8'));

const start = map.sections.find(s => s.section === 'start');
const contact = map.sections.find(s => s.section === 'contact');
const credits = map.sections.find(s => s.section === 'credits');
assert.ok(start && contact && credits);
assert.equal(start.zone, 'H-09');
assert.equal(start.object_id, 'start-cta');
assert.equal(contact.object_id, 'contact-desk');
assert.match(contact.response, /mailto/);
assert.match(contact.response, /legal/);
assert.match(contact.response, /login-support/);
assert.equal(credits.object_id, 'credits-wall');
assert.equal(credits.next, 'leave-main-hall');

assert.match(index, /href="mailto:management\.home\.finder@gmail\.com"/);
assert.match(index, /href="privacy\.html"/);
assert.match(index, /href="login\.html"/);

const objects = new Map(physical.objects.map(o => [o.id, o]));
for (const id of ['start-cta','contact-desk','credits-wall']) {
  assert.ok(objects.has(id), `${id} must exist in current physical UI object contract`);
}
assert.deepEqual(contract.povs['H-09'].object_ids, ['start-cta','contact-desk','credits-wall']);
console.log('PASS: DD05 H-09 Start / Contact / Credits / Exit mapping against current authority');

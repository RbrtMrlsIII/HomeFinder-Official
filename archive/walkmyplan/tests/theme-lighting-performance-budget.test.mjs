import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const data = (name) => JSON.parse(fs.readFileSync(path.join(root,'cinematic','WalkMyPlan','data',name),'utf8'));

const theme = data('theme-lighting-contract.json');
const perf = data('performance-budget-matrix.json');
const room = data('room-theme-performance-map.json');
const visibility = data('visibility-performance-policy.json');

const themes = Object.keys(theme.themes);
assert.deepEqual(themes.sort(), ['day','mist','night','rain','storm','sunset']);
assert.equal(theme.transition.mode, 'interpolated');
assert.equal(theme.transition.routeBlocking, false);
for (const forbidden of theme.independence) assert.ok(forbidden);

assert.deepEqual(Object.keys(perf.deviceTiers), ['tier0','tier1','tier2','tier3']);
assert.ok(perf.deviceTiers.tier1.maxDpr <= 1.25);
assert.ok(perf.deviceTiers.tier3.maxDpr <= 2);
assert.equal(perf.scrollCameraRules.unloadOnSectionChange, false);
assert.equal(perf.scrollCameraRules.sameRoom, true);

const expectedRooms = ['BACKYARD','MAIN HALL','LOGIN ROOM','REGISTER ROOM','MARKET','PROFILE SUITE','BROKER HQ','OPERATIONS','REFERENCE'];
assert.deepEqual(room.rooms.map(r=>r.room), expectedRooms);
for (const r of room.rooms) assert.ok(r.budget);

assert.ok(visibility.roles.includes('admin'));
assert.match(visibility.presentation.admin, /Staff\/Moderator/i);
assert.equal(visibility.performanceCannotOverride, 'authorization');

console.log('PASS theme-lighting-performance-budget');
console.log(`themes: ${themes.length}`);
console.log(`rooms: ${room.rooms.length}`);
console.log(`device tiers: ${Object.keys(perf.deviceTiers).length}`);
console.log('section scroll keeps room loaded: yes');

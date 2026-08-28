import assert from 'node:assert/strict';
import fs from 'node:fs';
import { auditExport, normalizePackageValue } from '../tools/boost-normalization.mjs';

assert.equal(normalizePackageValue('I'), 1);
assert.equal(normalizePackageValue('V'), 5);
assert.equal(normalizePackageValue(3), 3);
assert.equal(normalizePackageValue('unknown'), null);
assert.equal(normalizePackageValue(7), null);

const fixture = JSON.parse(fs.readFileSync(new URL('../verify/fixtures/boost-export.sample.json', import.meta.url)));
const out = auditExport(fixture);
const byUid = Object.fromEntries(out.map(r => [r.uid, r]));

assert.equal(byUid['uid-canonical'].roles.seeker.status, 'canonical');
assert.equal(byUid['uid-roman'].roles.seeker.status, 'legacy-or-mixed');
assert.equal(byUid['uid-roman'].roles.seeker.packageId, 3);
assert.deepEqual(byUid['uid-roman'].roles.seeker.recommendWrite, { active: true, package: 3 });
assert.equal(byUid['uid-level'].roles.seeker.packageId, 4);
assert.equal(byUid['uid-conflict'].roles.seeker.status, 'conflict');
assert.equal(byUid['uid-conflict'].roles.seeker.recommendWrite, null);

console.log('Patch 45 boost normalization audit PASS.');

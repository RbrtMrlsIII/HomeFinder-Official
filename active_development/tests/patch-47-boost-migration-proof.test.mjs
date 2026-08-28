import assert from 'node:assert/strict';
import fs from 'node:fs';
import { proveMigration } from '../tools/boost-migration-proof.mjs';

const before = JSON.parse(fs.readFileSync(new URL('../verify/fixtures/boost-before-p47.json', import.meta.url)));
const after = JSON.parse(fs.readFileSync(new URL('../verify/fixtures/boost-after-p47.json', import.meta.url)));
const cleanAfter = JSON.parse(fs.readFileSync(new URL('../verify/fixtures/boost-after-p47-clean.json', import.meta.url)));
const out = proveMigration(before, after);
const clean = proveMigration(before, cleanAfter);

assert.equal(out.patch, 47);
assert.equal(out.proof.beforeActiveLegacyCount, 3);
assert.equal(out.proof.migratedAndCanonicalCount, 2);
assert.equal(out.proof.activeNoncanonicalAfterCount, 1);
assert.equal(out.proof.activeRecordMissingAfterCount, 0);
assert.equal(out.proof.activeNoncanonicalAfterCount, 1);
assert.equal(out.proof.parserRetirementEligible, false);
assert.equal(clean.proof.activeNoncanonicalAfterCount, 0);
assert.equal(clean.proof.activeRecordMissingAfterCount, 0);
assert.equal(clean.proof.quarantinedCount, 1);
assert.equal(clean.proof.parserRetirementEligible, true);

const conflict = out.rows.find(r => r.uid === 'uid-conflict' && r.role === 'seeker');
assert.equal(conflict.beforeLegacy, true);
assert.equal(conflict.afterCanonical, false);
assert.equal(conflict.status, 'active-noncanonical');

console.log('Patch 47 boost migration proof PASS.');

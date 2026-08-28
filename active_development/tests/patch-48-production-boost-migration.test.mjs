import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildMigrationPlan, executeMigration } from '../tools/boost-migration-executor.mjs';
import { createJsonAdapter } from '../tools/adapters/json-production-adapter.mjs';

const fixture = JSON.parse(fs.readFileSync(new URL('../verify/fixtures/boost-before-p47.json', import.meta.url)));

const plan = buildMigrationPlan(fixture);
assert.equal(plan.patch, 48);
assert.equal(plan.executable, false);
assert.equal(plan.changes.length, 2);
assert.equal(plan.quarantines.length, 1);
assert.equal(plan.blockers.length, 0);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'homefinder-p48-'));
const file = path.join(tmp, 'boosts.json');
fs.writeFileSync(file, JSON.stringify(fixture, null, 2));

await assert.rejects(
  () => executeMigration({
    beforeInput: fixture,
    adapter: createJsonAdapter(file),
    receipt: { authorized: true, snapshotId: 'fixture-p47', operator: 'patch48-test' }
  }),
  /MIGRATION_BLOCKED/
);

const clean = JSON.parse(fs.readFileSync(new URL('../verify/fixtures/boost-after-p47-clean.json', import.meta.url)));
const cleanFile = path.join(tmp, 'clean.json');
fs.writeFileSync(cleanFile, JSON.stringify(clean, null, 2));
const cleanPlan = buildMigrationPlan(clean);
assert.equal(cleanPlan.executable, true);
assert.equal(cleanPlan.changes.length, 0);

const cleanResult = await executeMigration({
  beforeInput: clean,
  adapter: createJsonAdapter(cleanFile),
  receipt: { authorized: true, snapshotId: 'fixture-clean', operator: 'patch48-test' }
});
assert.equal(cleanResult.proof.proof.activeNoncanonicalAfterCount, 0);
assert.equal(cleanResult.proof.proof.activeRecordMissingAfterCount, 0);

const mismatchFile = path.join(tmp, 'mismatch.json');
fs.writeFileSync(mismatchFile, JSON.stringify(clean, null, 2));
await assert.rejects(
  () => executeMigration({
    beforeInput: fixture,
    adapter: createJsonAdapter(mismatchFile),
    receipt: { authorized: true, snapshotId: 'fixture-mismatch', operator: 'patch48-test' }
  }),
  /LIVE_SNAPSHOT_MISMATCH/
);

await assert.rejects(
  () => executeMigration({
    beforeInput: clean,
    adapter: createJsonAdapter(cleanFile),
    receipt: { authorized: false, snapshotId: 'fixture-clean', operator: 'patch48-test' }
  }),
  /authorized receipt/
);

console.log('Patch 48 production boost migration execution gate PASS.');

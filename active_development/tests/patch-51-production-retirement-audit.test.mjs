import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditProductionRetirement } from '../tools/patch-51-production-retirement-audit.mjs';

const clean = JSON.parse(fs.readFileSync(new URL('../verify/fixtures/boost-after-p47-clean.json', import.meta.url)));
const before = JSON.parse(fs.readFileSync(new URL('../verify/fixtures/boost-before-p47.json', import.meta.url)));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'homefinder-p51-'));

const migrationReceipt = {
  authorized: true,
  snapshotId: 'production-snapshot-51-fixture',
  operator: 'patch51-test',
  approvedAt: '2026-08-21T00:00:00Z'
};

const deploymentReceipt = {
  deployed: true,
  releaseId: 'patch50-fixture-release',
  deployedAt: '2026-08-21T00:05:00Z',
  parserCompatibilityRestored: false
};

const result = auditProductionRetirement({
  before: clean,
  after: clean,
  migrationReceipt,
  deploymentReceipt
});
assert.equal(result.patch, '51');
assert.equal(result.after.activeNoncanonicalAfterCount, 0);
assert.equal(result.parserRetirement, 'verified');
assert.equal(result.compatibilityRestoration, false);

assert.throws(
  () => auditProductionRetirement({
    before: clean,
    after: clean,
    migrationReceipt: { ...migrationReceipt, authorized: false },
    deploymentReceipt
  }),
  /PRODUCTION_AUTHORIZATION_MISSING/
);

assert.throws(
  () => auditProductionRetirement({ before: clean, after: clean, migrationReceipt, deploymentReceipt: { ...deploymentReceipt, deployed: false } }),
  /PRODUCTION_DEPLOYMENT_MISSING/
);

assert.throws(
  () => auditProductionRetirement({
    before,
    after: clean,
    migrationReceipt: { ...migrationReceipt, beforeSnapshotSha256: 'not-the-real-hash' },
    deploymentReceipt
  }),
  /BEFORE_SNAPSHOT_HASH_MISMATCH/
);

const contaminated = JSON.parse(JSON.stringify(clean));
contaminated['uid-retired'] = { seeker: { active: true, package: 2, level: 'II' } };
assert.throws(
  () => auditProductionRetirement({ before: clean, after: contaminated, migrationReceipt, deploymentReceipt }),
  /NONCANONICAL_ACTIVE_RECORDS/
);

fs.writeFileSync(path.join(tmp, 'PASS.txt'), 'Patch 51 production retirement audit tests PASS.\n');
console.log('Patch 51 production retirement audit PASS.');

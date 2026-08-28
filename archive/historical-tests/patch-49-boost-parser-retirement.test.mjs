import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { evaluateRetirement } from '../tools/boost-parser-retirement-gate.mjs';

const root = process.cwd();
const tiers = fs.readFileSync(path.join(root, 'js/tiers.js'), 'utf8');
const adminUsers = fs.readFileSync(path.join(root, 'js/admin/users.js'), 'utf8');
const receipt = JSON.parse(fs.readFileSync(path.join(root, 'docs/migrations/PATCH-48-PRODUCTION-BOOST-MIGRATION-RECEIPT-TEMPLATE.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(root, 'docs/dictionary/domains/compatibility.dictionary.json'), 'utf8'));

assert.match(adminUsers, /package:\s*Number\(packageEl\.value\)\s*\|\|\s*0/);
assert.doesNotMatch(adminUsers, /level\s*:/);
assert.doesNotMatch(adminUsers, /package\s*:\s*['"](?:I|II|III|IV|V)['"]/);

const c6 = registry.surfaces.find(s => s.id === 'COMP-006');
const c7 = registry.surfaces.find(s => s.id === 'COMP-007');
assert.equal(c6.status, 'retired');
assert.equal(c7.status, 'retired');

const blocked = evaluateRetirement({
  receipt,
  sourceText: tiers,
  writerText: adminUsers
});
assert.equal(blocked.eligible, false);
assert.ok(blocked.blockers.includes('PATCH48_NOT_COMPLETED'));
assert.equal(blocked.action, 'KEEP_PARSER_QUARANTINED');

const eligible = evaluateRetirement({
  receipt: {
    ...receipt,
    authorized: true,
    snapshotId: 'prod-boosts-verified',
    operator: 'security-migration',
    status: 'completed',
    proof: {
      activeNoncanonicalAfterCount: 0,
      activeRecordMissingAfterCount: 0,
      parserRetirementEligible: true
    }
  },
  sourceText: tiers,
  writerText: adminUsers
});
assert.equal(eligible.eligible, true);
assert.equal(eligible.action, 'REMOVE_BOOST_COMPATIBILITY_PARSER');

console.log('Patch 49 boost parser retirement gate regression PASS.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const tiers = fs.readFileSync(path.join(root, 'js/tiers.js'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'js/admin/users.js'), 'utf8');
const cloudTiers = fs.readFileSync(path.join(root, 'firebase/functions/tiers.js'), 'utf8');
const cloudIndex = fs.readFileSync(path.join(root, 'firebase/functions/index.js'), 'utf8');
const rules = fs.readFileSync(path.join(root, 'firebase/firestore.rules'), 'utf8');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'docs/dictionary/domains/compatibility.dictionary.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/patches/PATCH-50-MANIFEST.json'), 'utf8'));

assert.doesNotMatch(tiers, /legacy seeker used `level`/);
assert.doesNotMatch(tiers, /const legacy\s*=\s*\{\s*I:/);
assert.doesNotMatch(tiers, /roleBoost\.level/);
assert.doesNotMatch(tiers, /legacy\s*=\s*resolveBoostPackageId/);
assert.doesNotMatch(admin, /\{ I:1, II:2, III:3, IV:4, V:5 \}/);
assert.doesNotMatch(admin, /entry\.level/);
assert.doesNotMatch(cloudTiers, /roleBoost\.level/);
assert.doesNotMatch(cloudTiers, /normalizeBoostPackageValue/);
assert.doesNotMatch(cloudIndex, /const legacy = tiers\.resolveBoostPackageId/);
assert.doesNotMatch(rules, /legacy level/);
assert.doesNotMatch(rules, /package == 'I'/);
assert.doesNotMatch(rules, /hasAny\(\['level'\]\)/);

const c6 = registry.surfaces.find(s => s.id === 'COMP-006');
const c7 = registry.surfaces.find(s => s.id === 'COMP-007');
assert.equal(c6.status, 'retired');
assert.equal(c7.status, 'retired');
assert.equal(manifest.patch, '50');
assert.equal(manifest.status, 'locally-executed-production-deployment-gated');

console.log('Patch 50 boost parser retirement PASS.');

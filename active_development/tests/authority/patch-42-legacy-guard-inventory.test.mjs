import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const rules = read('firebase/firestore.rules');
const matrix = json('docs/dictionary/domains/capability-boundaries.dictionary.json');
const manifest = json('docs/patches/PATCH-42-MANIFEST.json');

assert.equal((rules.match(/\bisStaff\(\)/g) || []).length, 0, 'legacy isStaff() must remain absent from executable rules');
assert.doesNotMatch(rules, /function\s+isStaff\s*\(/, 'legacy isStaff helper must remain retired');
assert.equal(matrix.legacyHelper.status, 'retired-no-active-call-sites');
assert.equal(matrix.legacyHelper.retiredInPatch, 42);
assert.equal(manifest.inventory.activeExecutableReferencesAfterPatch, 0);
assert.equal(manifest.inventory.compatibilityHelperRetired, true);
assert.match(read('docs/migrations/PATCH-43-COMPATIBILITY-SURFACE-INVENTORY.md'), /Patch 43 — Compatibility Surface Inventory & Migration Gate/);

console.log('PATCH 42 LEGACY GUARD INVENTORY & MIGRATION GATE: PASS');

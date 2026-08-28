import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const registryPath = path.join(root, 'docs/dictionary/domains/compatibility.dictionary.json');
const reportPath = path.join(root, 'docs/migrations/PATCH-43-COMPATIBILITY-SURFACE-INVENTORY.md');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const report = fs.readFileSync(reportPath, 'utf8');

assert.equal(registry.authority, 'docs/migrations/PATCH-43-COMPATIBILITY-SURFACE-INVENTORY.md');
assert.ok(Array.isArray(registry.surfaces) && registry.surfaces.length >= 20);

const ids = registry.surfaces.map((s) => s.id);
assert.equal(new Set(ids).size, ids.length, 'compatibility IDs must be unique');

for (const surface of registry.surfaces) {
  assert.ok(surface.id.startsWith('COMP-'), `${surface.id} must use COMP-* id`);
  assert.ok(surface.target, `${surface.id} needs a target`);
  assert.ok(surface.status, `${surface.id} needs a migration status`);
  assert.ok(surface.authority, `${surface.id} needs an authority`);
  assert.ok(surface.owner, `${surface.id} needs an owner`);
  assert.match(report, new RegExp(surface.id));
}

const sourcePaths = [
  'js/tiers.js',
  'firebase/functions/tiers.js',
  'js/listing-create-gate.js',
  'js/collections.js',
  'js/profile/active-listings.js',
  'firebase/functions/index.js',
  'supabase/functions/get-kyc-signed-url/index.ts',
  'js/profile/messages.js',
  'js/profile/listing-lock.js',
  'js/profile/logout.js',
  'js/profile/profile-data.js',
  'js/market-map.js',
  'js/market-chrome.js',
  'js/admin/verifications.js',
  'js/listing-catalog.js',
  'js/admin-uid.js',
  'js/admin/core.js',
  'js/pins-model.js'
];
for (const rel of sourcePaths) {
  assert.ok(fs.existsSync(path.join(root, rel)), `inventory source missing: ${rel}`);
}

// Patch 42 retired isStaff. Patch 43 must not resurrect it.
const executableRoots = ['js', 'firebase', 'supabase'];
let executableText = '';
for (const dir of executableRoots) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  const stack = [abs];
  while (stack.length) {
    const cur = stack.pop();
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (/\.(js|ts|html)$/.test(entry.name)) executableText += fs.readFileSync(full, 'utf8');
    }
  }
}
assert.equal((executableText.match(/\bisStaff\s*\(/g) || []).length, 0, 'retired isStaff() must remain absent');

console.log(`Patch 43 compatibility registry PASS: ${registry.surfaces.length} surfaces inventoried.`);

import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parse } from 'node:querystring';

const root = new URL('..', import.meta.url).pathname;
const p = `${root}/data/master-page-room-pov-theme-role-object-responsive.csv`;
const csv = fs.readFileSync(p, 'utf8').trim().split(/\r?\n/);
const header = csv.shift().split(',');
for (const name of ['page','route','room','pov','allowed_environment_themes','ui_theme_compatibility','role_state','physical_ui_objects','responsive_state']) {
  assert.ok(header.includes(name), `missing matrix column: ${name}`);
}
assert.ok(csv.length >= 49, `expected at least 49 POV/page rows, got ${csv.length}`);
for (const line of csv) {
  assert.equal((line.match(/environment-driven; no fixed light\/dark branch/g) || []).length, 1, 'legacy UI theme branch found');
  assert.match(line, /(public|authenticated|broker|admin|moderator|staff)/);
}
console.log(`master-matrix-contract: PASS (${csv.length} rows)`);

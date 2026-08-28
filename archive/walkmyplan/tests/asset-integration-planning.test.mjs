import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const wm = path.join(root, 'cinematic', 'WalkMyPlan');
const read = p => JSON.parse(fs.readFileSync(path.join(wm, p), 'utf8'));

const manifest = read('data/asset-integration-manifest.json');
const loading = read('data/asset-loading-graph.json');
const contract = read('data/asset-source-license-contract.json');
const sections = read('data/section-camera-choreography.json');

assert.equal(manifest.assets.length, 14, 'expected 14 planned hero records');
assert.equal(manifest.asset_root, 'cinematic/WalkMyPlan/assets/');
assert.equal(manifest.checkpoint_policy.includes('excluded'), true);
assert.deepEqual(loading.stages.map(s => s.name), [
  'global-house-shell', 'current-room-shell', 'current-hero', 'next-likely-room', 'secondary-objects-on-demand'
]);
assert.equal(loading.section_scroll_rule.includes('same room') || loading.section_scroll_rule.includes('loaded room'), true);
assert.equal(loading.tab_rule.includes('station camera'), true);
assert.equal(loading.door_rule.includes('route authorization'), true);
assert.equal(contract.required_before_production, true);
assert.equal(contract.fields.includes('license'), true);
assert.equal(contract.fields.includes('checksum_sha256'), true);
assert.ok(sections.pages.length >= 10, 'section choreography registry should cover major pages');

for (const a of manifest.assets) {
  assert.equal(a.status, 'PLANNED');
  assert.equal(a.source_status, 'NOT_PROVIDED');
  assert.equal(a.license_status, 'NOT_PROVIDED');
  assert.equal(a.checksum_status, 'NOT_APPLICABLE_UNTIL_ASSET_ARRIVES');
  for (const tier of ['tier0','tier1','tier2','tier3']) assert.ok(a.runtime_variants[tier]);
}

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => {
    const p=path.join(dir,e.name);
    return e.isDirectory()?walk(p):[p];
  });
}
const forbidden = walk(wm).filter(p => /\.(glb|gltf|mp4|webm)$/i.test(p));
assert.equal(forbidden.length, 0, 'no production media should be present in this planning checkpoint');

console.log('PASS asset-integration-planning');
console.log(`hero records: ${manifest.assets.length}`);
console.log(`pages: ${sections.pages.length}`);
console.log('production media present: 0');

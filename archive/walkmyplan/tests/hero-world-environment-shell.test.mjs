import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = 'cinematic/WalkMyPlan/data';
const choreography = JSON.parse(fs.readFileSync(`${base}/section-camera-choreography.json`, 'utf8'));
const heroes = JSON.parse(fs.readFileSync(`${base}/hero-world-shell-registry.json`, 'utf8'));
const env = JSON.parse(fs.readFileSync(`${base}/environment-shell-registry.json`, 'utf8'));

assert.equal(choreography.status, 'CANONICAL_PLANNING / ADJUSTABLE');
assert.ok(choreography.pages.length >= 10, 'all confirmed major pages should be covered');

for (const page of choreography.pages) {
  assert.ok(page.page_id && page.route && page.room, 'page needs identity');
  let previousEnd = 0;
  for (const section of page.sections) {
    const [id, camera, start, end, direction, focal] = section;
    assert.ok(id && camera && direction && focal, `${page.page_id}: section metadata incomplete`);
    assert.ok(start >= 0 && end <= 1 && start < end, `${page.page_id}/${id}: invalid scroll range`);
    assert.ok(start >= previousEnd - 1e-9, `${page.page_id}: section ranges overlap or regress`);
    previousEnd = end;
  }
  assert.ok(Math.abs(previousEnd - 1) < 1e-9, `${page.page_id}: choreography must cover full scroll range`);
}

const heroRooms = new Set(heroes.rooms.map(r => r.room));
for (const page of choreography.pages) {
  assert.ok(heroRooms.has(page.room), `missing hero shell for ${page.room}`);
}

assert.deepEqual(env.modes.sort(), ['day','mist','night','rain','storm','sunset']);
assert.ok(env.forbidden_effects.includes('changing roles'));
assert.ok(env.forbidden_effects.includes('changing routes'));

const productionAssets = [];
for (const dir of ['assets', 'cinematic/WalkMyPlan/assets']) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir, {recursive:true});
    productionAssets.push(...files.filter(f => /\.(glb|gltf|mp4|webm)$/i.test(String(f))));
  }
}
assert.equal(productionAssets.length, 0, 'A4.4C3.12 must not introduce production 3D/video assets');

console.log(`PASS hero-world-environment-shell (${choreography.pages.length} pages, ${choreography.pages.reduce((n,p)=>n+p.sections.length,0)} section camera states)`);

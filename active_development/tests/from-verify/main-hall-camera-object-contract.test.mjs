import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const data = JSON.parse(fs.readFileSync(path.join(root,"data/main-hall-camera-object-contract.json"),"utf8"));
const objects = JSON.parse(fs.readFileSync(path.join(root,"data/physical-ui-objects.json"),"utf8"));
const ids = new Set(objects.objects.map(o => o.id));
const expected = ["H-01","H-02","H-03","H-04","H-05","H-06","H-07","H-08","H-09"];
assert.deepEqual(Object.keys(data.povs), expected);
for (const [pov, entry] of Object.entries(data.povs)) {
  assert.equal(entry.role_states.length > 0, true, `${pov}: role state missing`);
  for (const oid of entry.object_ids) assert.ok(ids.has(oid), `${pov}: missing object ${oid}`);
}
assert.deepEqual(data.allowed_environment_themes,["day","sunset","night","rain","mist","storm"]);
assert.equal(data.ui_theme_mode,"environment-driven");
assert.equal(data.camera_security_boundary,"presentation-only");
console.log("PASS main-hall-camera-object contract", Object.keys(data.povs).length, "POVs");

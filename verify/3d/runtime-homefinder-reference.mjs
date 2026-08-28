import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const viewer = "active_development/3d/app/homefinder-viewer.js";
const page = "active_development/3d/viewer/SweetHome3DJSViewer-7.5.2/HomeFinderViewer.html";
const canonical = "master/HomeFinder.sh3d";

const source = fs.readFileSync(path.join(root, viewer), "utf8");
const match = source.match(/var\s+HOME_URL\s*=\s*"([^"]+)"/);
assert(match, "HOME_URL declaration missing");
const homeUrl = match[1];

const pageDir = path.posix.dirname(page);
const resolved = path.posix.normalize(path.posix.join(pageDir, homeUrl));
assert.equal(resolved, canonical, `HOME_URL resolves to ${resolved}, expected ${canonical}`);
assert(fs.existsSync(path.join(root, canonical)), "canonical HomeFinder.sh3d is missing");

for (const forbidden of ["2BedroomHouseWithBasement.sh3d", "default.sh3d", "HomeFinder_MAIN_HALL_CONTRACT_PHASE13.sh3d"]) {
  assert(!source.includes(forbidden), `${viewer} references forbidden legacy asset ${forbidden}`);
}

const sh3dFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.toLowerCase().endsWith(".sh3d")) sh3dFiles.push(path.relative(root, full).replaceAll("\\", "/"));
  }
}
walk(root);
assert(sh3dFiles.includes(canonical), "canonical SH3D is missing");
const evidenceOnly = sh3dFiles.filter(file =>
  file.startsWith("3d/imports/") || file.startsWith("3d/staging/")
);
const unexpected = sh3dFiles.filter(file => file !== canonical && !evidenceOnly.includes(file));
assert.deepEqual(unexpected, [], `unexpected SH3D outside canonical/evidence-only paths: ${unexpected.join(", ")}`);
assert(!source.includes("3d/imports/") && !source.includes("3d/staging/"),
  "runtime viewer must not reference evidence-only SH3D assets");

console.log("3D runtime authority: PASS");
console.log(`HOME_URL: ${homeUrl}`);
console.log(`Resolved: ${resolved}`);
console.log(`Canonical: ${canonical}`);
console.log(`SH3D files: ${sh3dFiles.length} (1 canonical + ${evidenceOnly.length} evidence-only)`);

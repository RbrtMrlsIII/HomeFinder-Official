import fs from "node:fs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const canonical = "master/HomeFinder.sh3d";
const walk = (dir) => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => {
  const p = `${dir}/${e.name}`;
  return e.isDirectory() ? walk(p) : [p];
});
const sh3d = walk(".").filter(p => p.toLowerCase().endsWith(".sh3d")).map(p => p.replace(/^.\//,""));
assert.ok(sh3d.includes(canonical), "canonical SH3D must exist");
const evidenceOnly = sh3d.filter(p => p !== canonical);
assert.ok(evidenceOnly.every(p => /^3d\/(?:imports|staging)\/.*\.sh3d$/i.test(p)),
  "noncanonical SH3D files must remain under evidence-only imports/staging paths");

const list = execFileSync("unzip", ["-Z1", canonical], {encoding:"utf8"});
assert.match(list, /(^|\n)Home\.xml(\n|$)/, "canonical SH3D must contain Home.xml");

const xml = execFileSync("unzip", ["-p", canonical, "Home.xml"], {encoding:"utf8"});
const hf = [...xml.matchAll(/<observerCamera\b[^>]*\bhfLogicalPOV="([^"]+)"[^>]*\bhfVisualStatus="([^"]+)"/g)];
assert.equal(hf.length, 9, "expected nine HomeFinder canonical cameras");
assert.ok(hf.every(([,pov,status]) => /^H-\d+$/.test(pov) && status === "TUNED_VISUAL_REVIEW"));
assert.match(xml, /hfSecurity="presentation-only"/, "3D camera layer must remain presentation-only");

console.log("canonical 3D authority: PASS");

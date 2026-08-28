import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const lockPath = path.join(root, "docs/contracts/5.5G6C-protected-logic-freeze.json");
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));

if (lock.status !== "FROZEN") throw new Error("Protected logic freeze is not FROZEN.");

const failures = [];
for (const [rel, expected] of Object.entries(lock.protected_hashes || {})) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    failures.push(`${rel}: missing`);
    continue;
  }
  const actual = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if (actual !== expected) failures.push(`${rel}: hash mismatch`);
}
if (failures.length) {
  console.error("Protected logic freeze: FAIL");
  failures.forEach(x => console.error(` - ${x}`));
  process.exit(1);
}
console.log(`Protected logic freeze: PASS (${Object.keys(lock.protected_hashes || {}).length} protected files)`);

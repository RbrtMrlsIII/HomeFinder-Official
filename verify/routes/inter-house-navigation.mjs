import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = path.join(root, "docs/json/inter-house-navigation-contract.json");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const failures = [];

if (contract.status !== "ACTIVE — NON-PHYSICAL TRANSITION MODEL") failures.push("contract is not active non-physical transition model");
if (contract.physical_routes_promoted !== 0) failures.push("physical routes must remain 0");
if (!contract.role_policy.physical_travel_never_changes_role) failures.push("role invariant missing");
const forbidden = contract.transitions.filter(x => x.mode === "forbidden");
if (forbidden.length !== 2) failures.push("House 2↔House 3 direct prohibition is incomplete");
if (contract.transitions.some(x => x.from === "house-2" && x.to === "house-3" && x.mode !== "forbidden")) failures.push("House 2→House 3 direct transition exists");
if (contract.transitions.some(x => x.from === "house-3" && x.to === "house-2" && x.mode !== "forbidden")) failures.push("House 3→House 2 direct transition exists");

if (failures.length) {
  console.error("Inter-house navigation contract: FAIL");
  failures.forEach(x => console.error(` - ${x}`));
  process.exit(1);
}
console.log("Inter-house navigation contract: PASS");

import fs from "node:fs";
import assert from "node:assert/strict";

const c = JSON.parse(fs.readFileSync("docs/json/firebase/canonical-roles.json", "utf8"));
assert.deepEqual(c.roles, ["owner","seeker","broker","staff","moderator","admin"]);
assert.equal(c.aliases.landlord, "owner");
assert.equal(c.aliases.property_owner, "owner");
console.log("canonical roles: PASS");

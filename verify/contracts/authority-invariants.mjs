import fs from "node:fs";
import assert from "node:assert/strict";

const authority = JSON.parse(fs.readFileSync("docs/json/project-authority.json", "utf8"));
assert.equal(authority.firebase.database, "homefinder");
assert.deepEqual(authority.data.canonical.slice(0, 2), ["propertyListings", "wantedListings"]);
assert.ok(authority.data.retired.includes("properties"));
assert.equal(authority.threeD.canonicalModel, "master/HomeFinder.sh3d");
console.log("authority invariants: PASS");

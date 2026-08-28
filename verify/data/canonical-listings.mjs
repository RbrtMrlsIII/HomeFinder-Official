import fs from "node:fs";
import assert from "node:assert/strict";

const c = JSON.parse(fs.readFileSync("docs/contracts/data/canonical-data.json", "utf8"));
assert.ok(c.canonicalCollections.propertyListings);
assert.ok(c.canonicalCollections.wantedListings);
assert.equal(c.retiredCollections.properties.activeReads, false);
assert.equal(c.retiredCollections.properties.activeWrites, false);
console.log("canonical listing data: PASS");

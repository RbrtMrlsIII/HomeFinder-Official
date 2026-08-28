import assert from "node:assert/strict";
import fs from "node:fs";
const read = p => fs.readFileSync(p, "utf8");
const functions = read("firebase/functions/index.js");
const ledger = read("js/points-ledger.js");
const rules = read("firebase/firestore.rules");

assert.match(functions, /LISTING_POINT_CAP_PER_DAY\s*=\s*50/);
assert.match(functions, /LISTING_POINT_VALUE\s*=\s*5/);
assert.match(functions, /pointsDaily/);
assert.match(functions, /propertyPoints/);
assert.match(functions, /wantedPoints/);
assert.match(functions, /exports\.awardPropertyListingPublicationPoints\s*=\s*onDocumentWritten/);
assert.match(functions, /exports\.awardWantedListingPublicationPoints\s*=\s*onDocumentWritten/);
assert.match(functions, /database:\s*"homefinder"/);
assert.match(functions, /afterStatus === "active" && beforeStatus !== "active"/);
assert.match(functions, /event: "listing_published"/);
assert.match(functions, /event: "wanted_published"/);
assert.match(functions, /FieldValue\.increment\(5\)/);
assert.match(functions, /eventKey/);
assert.match(functions, /usedForCategory \+ points > LISTING_POINT_CAP_PER_DAY/);

assert.match(ledger, /WANTED_PUBLISHED: 5/);
assert.match(ledger, /LISTING_POINT_DAILY_CAP = 50/);
assert.match(rules, /match \/pointsLedger\/\{entryId\} \{/);
assert.match(rules, /allow create: if false;/);

console.log("Foundation Repair 03 anti-abuse authority checks: PASS");

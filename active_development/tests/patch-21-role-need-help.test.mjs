import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url).pathname;
const profile = fs.readFileSync(`${root}profile.html`, "utf8");
const needHelp = fs.readFileSync(`${root}js/profile/need-help.js`, "utf8");
const role = fs.readFileSync(`${root}js/profile/profile-data.js`, "utf8");

assert.match(profile, /id="panel-need-help"[^>]*data-asset="profile-need-help-panel"[^>]*data-roles="seeker,owner"/);
assert.match(profile, /data-help-type="find_property" data-roles="seeker"/);
assert.match(profile, /data-help-type="list_property" data-roles="owner"/);
assert.doesNotMatch(profile, /data-help-type="property_assistance"/);
assert.doesNotMatch(profile, /data-help-type="transaction_assistance"/);
assert.doesNotMatch(needHelp, /property_assistance|transaction_assistance/);
assert.match(needHelp, /find_property: \["seeker"\]/);
assert.match(needHelp, /list_property: \["owner"\]/);
assert.match(role, /canonicalRoleFromData\(data\) === "broker" && !isOpsUid\(user\.uid\)/);
assert.match(role, /window\.location\.replace\("broker-hq\.html"\)/);

console.log("Patch 21 role/Need Help contract: PASS");

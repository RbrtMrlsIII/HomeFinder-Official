import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import path from "node:path";

const root = path.resolve(new URL("../../", import.meta.url).pathname);
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");

test("Broker profile is HQ-owned and embedded", () => {
  const route = read("active_development/js/route-access-contract.js");
  const profile = read("active_development/profile.html");
  const hq = read("active_development/broker-hq.html");
  assert.match(route, /"profile\.html":\["owner","seeker"\]/);
  assert.match(hq, /id="bhq-profile-frame"/);
  assert.match(hq, /profile\.html\?embedded=broker-hq/);
  assert.doesNotMatch(hq, /href="profile\.html"[^>]*>[^<]*Profile/);
  assert.match(profile, /data-tab="gov-housing" data-roles="seeker,owner,broker"/);
});

test("Wanted saves are server-authoritative for owner/broker", () => {
  const fn = read("active_development/firebase/functions/index.js");
  const rules = read("active_development/firebase/firestore.rules");
  assert.match(fn, /exports\.toggleWantedSave\s*=\s*onCallActive/);
  assert.match(fn, /new Set\(\["owner",\s*"broker"\]\)/);
  assert.match(fn, /collection\("users"\)\.doc\(actorUid\)\.collection\("savedWanted"\)/);
  assert.ok(rules.includes("match /users/{uid}/savedWanted/{wantedId}"));
});

test("Suspension expiry has scheduled reconciliation", () => {
  const fn = read("active_development/firebase/functions/index.js");
  assert.match(fn, /exports\.reconcileExpiredSuspensions\s*=\s*onSchedule\(["']every 15 minutes["']/);
  assert.match(fn, /admin\.auth\(\)\.updateUser\(docSnap\.id, \{ disabled: false \}\)/);
});

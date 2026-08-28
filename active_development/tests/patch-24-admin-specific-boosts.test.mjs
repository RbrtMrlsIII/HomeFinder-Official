import fs from "node:fs";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url).pathname;
const users = fs.readFileSync(`${root}js/admin/users.js`, "utf8");
const rules = fs.readFileSync(`${root}firebase/firestore.rules`, "utf8");
const tiers = fs.readFileSync(`${root}js/tiers.js`, "utf8");

// Patch 24: Manage must resolve the selected user's real Firestore document.
assert.match(users, /openEditor\(btn\.dataset\.uid\)/);
assert.match(users, /getDoc\(doc\(db, "users", uid\)\)/);
assert.match(users, /getDoc\(doc\(db, "boosts", uid\)\)/);

// Every customer role gets only the catalog it can receive; brokers can receive both.
assert.match(users, /if \(role === "seeker"\) return \{ seeker: SEEKER_BOOST_PACKAGES \}/);
assert.match(users, /if \(role === "owner"\) return \{ owner: OWNER_BOOST_PACKAGES \}/);
assert.match(users, /if \(role === "broker"\) return \{ seeker: SEEKER_BOOST_PACKAGES, owner: OWNER_BOOST_PACKAGES \}/);
assert.match(users, /return \{\};/);

// The selected UID, not the admin UID, is the target of the boost write.
assert.match(users, /setDoc\(doc\(db, "boosts", uid\)/);
assert.match(users, /const verifySnap = await getDoc\(doc\(db, "boosts", uid\)\)/);
assert.match(users, /Firestore readback mismatch/);

// The UI explicitly exposes the persisted database path/state.
assert.match(users, /Firestore verified:<\/strong> boosts\//);

// Firestore remains the authoritative admin write boundary.
assert.match(rules, /match \/boosts\/\{uid\}/);
assert.match(rules, /allow write: if isAdmin\(\);/);

// The UI imports the same source-of-truth catalogs used by the app.
assert.match(tiers, /export const SEEKER_BOOST_PACKAGES/);
assert.match(tiers, /export const OWNER_BOOST_PACKAGES/);

console.log("Patch 24 Admin specific-user boost + Firestore readback contract: PASS");

import assert from "node:assert/strict";
import fs from "node:fs";

const rules = fs.readFileSync("active_development/firebase/firestore.rules", "utf8");
const adminUid = fs.readFileSync("active_development/js/admin-uid.js", "utf8");
const adminCore = fs.readFileSync("active_development/js/admin/core.js", "utf8");
const auth = fs.readFileSync("active_development/js/auth.js", "utf8");
const kyc = fs.readFileSync("active_development/js/profile/kyc-form.js", "utf8");
const migration = fs.readFileSync("active_development/supabase/migrations/0001_homefinder_storage_authority.sql", "utf8");
const storage = JSON.parse(fs.readFileSync("docs/json/supabase/storage-authority.json", "utf8"));

assert.match(rules, /function canonicalRoleFor\(uid\)/);
assert.match(rules, /canonicalRoleValue\(/);
assert.match(rules, /data\.get\(\s*'accountType'/);
assert.match(rules, /data\.get\('role', null\)/);

assert.match(adminUid, /opsRoleForCanonicalRole/);
assert.match(adminCore, /getDoc\(doc\(db, "users", u\.uid\)\)/);
assert.match(auth, /snap\.data\(\)\?\.canonicalRole/);
assert.match(kyc, /brokerLicense:\s*brokerFields/);
assert.doesNotMatch(kyc, /canonicalRole:\s*"broker"/);

assert.match(migration, /listing-images/);
assert.match(migration, /kyc-documents/);
assert.match(migration, /homefinder_public_listing_images_read/);
assert.equal(storage.buckets["listing-images"].clientUpload, "edge-function-only");
assert.equal(storage.buckets["kyc-documents"].clientUpload, "forbidden-direct");

console.log("Canonical role + Supabase storage authority: PASS");

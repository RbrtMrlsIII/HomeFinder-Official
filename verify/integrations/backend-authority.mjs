import fs from "node:fs";
import assert from "node:assert/strict";

const root = process.cwd();
const authority = JSON.parse(fs.readFileSync(`${root}/docs/json/supabase/backend-authority.json`, "utf8"));
assert.equal(authority.firebase.database, "homefinder");
assert.equal(authority.firebase.projectId, "homefinder-official");
assert.equal(authority.supabase.storage.listingImages, "listing-images");
assert.equal(authority.supabase.storage.kyc, "kyc-documents");
assert.equal(authority.data.retiredCollections.includes("properties"), true);
assert.equal(authority.data.canonicalCollections.includes("propertyListings"), true);
assert.equal(authority.data.canonicalCollections.includes("wantedListings"), true);

const kyc = JSON.parse(fs.readFileSync(`${root}/docs/json/firebase/kyc-authorization.json`, "utf8"));
assert.deepEqual(kyc.operations.signedUrl.allowedRoles, ["admin"]);
assert.deepEqual(kyc.operations.submit.allowedRoles, ["owner", "seeker", "broker"]);
assert.deepEqual(kyc.bootstrapAdminUids, ["IZN9EHQ9iTboWXoEgklJlWiwzz82"]);

const storage = JSON.parse(fs.readFileSync(`${root}/docs/json/supabase/storage-authority.json`, "utf8"));
assert.equal(storage.buckets["listing-images"].visibility, "public-read");
assert.equal(storage.buckets["kyc-documents"].visibility, "private");

console.log("backend-authority: PASS");

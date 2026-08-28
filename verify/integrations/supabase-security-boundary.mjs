import fs from "node:fs";
import assert from "node:assert/strict";

const read = (p) => fs.readFileSync(p, "utf8");
const root = process.cwd();
const listing = read(`${root}/active_development/supabase/functions/upload-listing-image/index.ts`);
const kycUpload = read(`${root}/active_development/supabase/functions/upload-kyc-document/index.ts`);
const kycSign = read(`${root}/active_development/supabase/functions/get-kyc-signed-url/index.ts`);
const client = read(`${root}/active_development/js/profile/listing-form.js`);
const supabase = read(`${root}/active_development/js/supabase.js`);

assert.match(listing, /verifyFirebaseIdToken/);
assert.match(listing, /fetchUserDoc/);
assert.match(listing, /Only owners and brokers may upload listing images/);
assert.match(kycUpload, /fetchUserDoc/);
assert.match(kycUpload, /KYC submission is not enabled for this role/);
assert.match(kycSign, /canonicalRole/);
assert.match(kycSign, /bootstrapAdminUids/);
assert.match(client, /uploadListingImageViaEdge/);
assert.doesNotMatch(client, /supabase\.storage\.from\(BUCKET_LISTINGS\)\.upload/);
assert.doesNotMatch(supabase, /supabase\.storage\.from\(bucket\)\.upload/);
assert.match(listing, /isJpegBytes/);
assert.match(kycUpload, /isJpegBytes/);
assert.match(client, /image\/(jpeg|jpg|png|webp)/);

console.log("supabase-security-boundary: PASS");

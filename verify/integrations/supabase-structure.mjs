import assert from "node:assert/strict";
import fs from "node:fs";

const functionsRoot = "active_development/supabase/functions";
const shared = fs.readFileSync(`${functionsRoot}/_shared/supabase-config.ts`, "utf8");
const uploadKyc = fs.readFileSync(`${functionsRoot}/upload-kyc-document/index.ts`, "utf8");
const getKyc = fs.readFileSync(`${functionsRoot}/get-kyc-signed-url/index.ts`, "utf8");
const uploadListing = fs.readFileSync(`${functionsRoot}/upload-listing-image/index.ts`, "utf8");
const migration = fs.readFileSync("active_development/supabase/migrations/0001_homefinder_storage_authority.sql", "utf8");

assert.match(shared, /export const SUPABASE_URL/);
assert.match(shared, /listingImages:\s*"listing-images"/);
assert.match(shared, /kycDocuments:\s*"kyc-documents"/);

for (const source of [uploadKyc, getKyc, uploadListing]) {
  assert.match(source, /_shared\/supabase-config\.ts/);
  assert.doesNotMatch(source, /const SUPABASE_URL\s*=/);
}

assert.doesNotMatch(uploadKyc, /const FIREBASE_PROJECT_ID\s*=/);
assert.match(uploadKyc, /FIREBASE_PROJECT_ID/);
assert.match(migration, /insert into storage\.buckets/i);

console.log("Supabase function structure: PASS");

import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";

const canonical = JSON.parse(fs.readFileSync("docs/json/firebase/kyc-authorization.json", "utf8"));
const normalize = (value) => {
  const copy = JSON.parse(JSON.stringify(value));
  delete copy._canonicalSha256;
  delete copy._generatedFrom;
  return copy;
};
const canonicalHash = crypto.createHash("sha256")
  .update(JSON.stringify(normalize(canonical)))
  .digest("hex");
for (const path of [
  "active_development/firebase/functions/contracts/kyc-authorization.json",
  "active_development/supabase/functions/_shared/kyc-authorization.json"
]) {
  const runtime = JSON.parse(fs.readFileSync(path, "utf8"));
  assert.deepEqual(normalize(runtime), normalize(canonical), `${path} differs from canonical KYC contract`);
  assert.equal(runtime._canonicalSha256, canonicalHash, `${path} has an invalid canonical KYC hash`);
}
console.log("KYC authority snapshots: PASS");

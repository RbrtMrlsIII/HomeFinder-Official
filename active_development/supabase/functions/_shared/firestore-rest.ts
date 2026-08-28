import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5";
import { FIREBASE_PROJECT_ID } from "./firebase-auth.ts";

async function getGoogleAccessToken(): Promise<string> {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not configured.");
  const service = JSON.parse(raw);
  const key = await importPKCS8(String(service.private_key).replace(/\\n/g, "\n"), "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/datastore" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(String(service.client_email))
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion })
  });
  if (!tokenRes.ok) throw new Error("Unable to obtain Google access token.");
  const body = await tokenRes.json();
  if (!body.access_token) throw new Error("Google access token missing.");
  return String(body.access_token);
}

function firestoreValueToJson(val: any): any {
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.mapValue !== undefined) return firestoreFieldsToJson(val.mapValue.fields || {});
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.integerValue !== undefined) return Number(val.integerValue);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.nullValue !== undefined) return null;
  if (val.arrayValue !== undefined) return (val.arrayValue.values || []).map(firestoreValueToJson);
  return null;
}
function firestoreFieldsToJson(fields: Record<string, any>): any {
  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(fields)) out[key] = firestoreValueToJson(val);
  return out;
}

export async function fetchUserDoc(uid: string): Promise<Record<string, any> | null> {
  const token = await getGoogleAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/homefinder/documents/users/${encodeURIComponent(uid)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const doc = await res.json();
  return firestoreFieldsToJson(doc.fields || {});
}

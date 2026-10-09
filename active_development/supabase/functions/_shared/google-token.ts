import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5";

/**
 * Returns an async function that yields a Google OAuth access token (scope: datastore) for the
 * service account in FIREBASE_SERVICE_ACCOUNT_JSON. Tokens are cached until shortly before expiry.
 * The key never leaves this function; tests use the Firestore emulator and never reach it.
 */
export function makeServiceAccountTokenProvider(raw: string | undefined): () => Promise<string> {
  let cached: { token: string; expiresAt: number } | null = null;
  return async () => {
    if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
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
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    });
    if (!res.ok) throw new Error("Unable to obtain Google access token.");
    const body = await res.json();
    if (!body.access_token) throw new Error("Google access token missing.");
    cached = { token: String(body.access_token), expiresAt: Date.now() + (Number(body.expires_in) || 3600) * 1000 };
    return cached.token;
  };
}

import { jwtVerify, createRemoteJWKSet } from "https://esm.sh/jose@5";

export const FIREBASE_PROJECT_ID = "homefinder-official";
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export async function verifyFirebaseIdToken(idToken: string) {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });
  return payload;
}

export function canonicalRole(raw: unknown): string | null {
  const value = String(raw ?? "").trim().toLowerCase();
  const roles = new Set(["owner", "seeker", "broker", "staff", "moderator", "admin"]);
  if (roles.has(value)) return value;
  const aliases: Record<string, string> = {
    landlord: "owner",
    property_owner: "owner",
    lessor: "owner",
    super: "admin",
  };
  return aliases[value] || null;
}

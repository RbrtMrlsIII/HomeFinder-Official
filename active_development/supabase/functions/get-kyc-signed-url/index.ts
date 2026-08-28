import kycAuthority from "../_shared/kyc-authorization.json" with { type: "json" };
import { verifyFirebaseIdToken, canonicalRole, FIREBASE_PROJECT_ID } from "../_shared/firebase-auth.ts";
import { fetchUserDoc } from "../_shared/firestore-rest.ts";
import { SUPABASE_URL, STORAGE_BUCKETS } from "../_shared/supabase-config.ts";

const KYC_TTL_SECONDS = Number(kycAuthority.operations.signedUrl.ttlSeconds || 900);
const KYC_ALLOWED_SIGNED_URL_ROLES = new Set(kycAuthority.operations.signedUrl.allowedRoles || ["admin"]);
const BOOTSTRAP_ADMIN_UIDS = new Set(kycAuthority.bootstrapAdminUids || []);

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.replace(/^Bearer\s+/i, "");
    if (!idToken) {
      return json({ error: "unauthenticated", message: "Sign in required." }, 401, origin);
    }

    let callerUid: string;
    try {
      const payload = await verifyFirebaseIdToken(idToken);
      callerUid = String(payload.sub);
    } catch (e) {
      console.error("token verify failed", e);
      return json({ error: "unauthenticated", message: "Invalid or expired session." }, 401, origin);
    }

    const callerDoc = await fetchUserDoc(callerUid);
    const role = canonicalRole(callerDoc?.canonicalRole || callerDoc?.accountType || callerDoc?.role);
    const isAdmin = KYC_ALLOWED_SIGNED_URL_ROLES.has(role || "")
      || BOOTSTRAP_ADMIN_UIDS.has(callerUid);
    if (!isAdmin) {
      return json({ error: "permission-denied", message: "Admin only — KYC documents are restricted." }, 403, origin);
    }

    const body = await req.json().catch(() => ({}));
    const targetUid = String(body?.uid || "").trim();
    const kind = body?.kind === "broker" ? "broker" : "id";
    if (!targetUid) {
      return json({ error: "invalid-argument", message: "uid required" }, 400, origin);
    }

    const u = await fetchUserDoc(targetUid);
    if (!u) {
      return json({ error: "not-found", message: "User not found" }, 404, origin);
    }
    const payload = kind === "broker" ? (u.brokerLicense || {}) : (u.idVerification || {});
    const storagePath = payload.storagePath || payload.path || null;
    if (!storagePath) {
      return json({ error: "not-found", message: "No KYC file path. User may need to resubmit." }, 404, origin);
    }

    // Note: name cannot start with SUPABASE_ (reserved by Supabase CLI)
    const serviceKey =
      Deno.env.get("SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) {
      return json({ error: "failed-precondition", message: "SERVICE_ROLE_KEY not configured." }, 500, origin);
    }

    const expiresIn = KYC_TTL_SECONDS; // 15 minutes -- same as the Cloud Function version
    const signRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/kyc-documents/${encodeURI(storagePath)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn }),
      }
    );
    const signBody = await signRes.json().catch(() => ({}));
    if (!signRes.ok) {
      console.error("supabase sign", signRes.status, signBody);
      return json({ error: "internal", message: signBody.message || signBody.error || "Could not sign KYC URL" }, 500, origin);
    }
    const signedPath = signBody.signedURL || signBody.signedUrl || signBody.data?.signedUrl;
    if (!signedPath) {
      return json({ error: "internal", message: "Empty signed URL from Supabase" }, 500, origin);
    }
    const full = signedPath.startsWith("http")
      ? signedPath
      : `${SUPABASE_URL}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;

    return json({ url: full, expiresIn, path: storagePath, kind }, 200, origin);
  } catch (e) {
    console.error(e);
    return json({ error: "internal", message: String((e as Error)?.message || e) }, 500, origin);
  }
});

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

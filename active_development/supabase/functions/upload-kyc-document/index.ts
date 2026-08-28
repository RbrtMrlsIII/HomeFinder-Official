// upload-kyc-document — Firebase ID token required; service_role upload to kyc-documents/{uid}/...
// Deploy: supabase functions deploy upload-kyc-document --no-verify-jwt
// Secret: SERVICE_ROLE_KEY (prod). Fallback: SUPABASE_SERVICE_ROLE_KEY

import { verifyFirebaseIdToken, canonicalRole, FIREBASE_PROJECT_ID } from "../_shared/firebase-auth.ts";
import kycAuthority from "../_shared/kyc-authorization.json" with { type: "json" };
import { fetchUserDoc } from "../_shared/firestore-rest.ts";
import { SUPABASE_URL, STORAGE_BUCKETS } from "../_shared/supabase-config.ts";
import { isJpegBytes } from "../_shared/jpeg.ts";

const SERVICE_KEY = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, content-type, x-kyc-kind",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const headers = cors(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
  if (!SERVICE_KEY) {
    return new Response(JSON.stringify({ error: "Server misconfigured (no service role)" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing Authorization Bearer token" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    const payload = await verifyFirebaseIdToken(token);
    const uid = String(payload.sub || "");
    if (!uid) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const userDoc = await fetchUserDoc(uid);
    const role = canonicalRole(userDoc?.canonicalRole || userDoc?.accountType || userDoc?.role);
    const allowedSubmitRoles = new Set(kycAuthority.operations.submit.allowedRoles || []);
    if (!role || !allowedSubmitRoles.has(role)) {
      return new Response(JSON.stringify({ error: "permission-denied", message: "KYC submission is not enabled for this role." }), {
        status: 403,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const kindHeader = (req.headers.get("x-kyc-kind") || "id").toLowerCase();
    const kind = kindHeader === "broker" || kindHeader === "prc" ? "prc" : "gov-id";
    const path = `${uid}/${kind}-${Date.now()}.jpg`;

    const body = new Uint8Array(await req.arrayBuffer());
    if (!body.byteLength || body.byteLength > 12 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Invalid body size" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    if (!isJpegBytes(body)) {
      return new Response(JSON.stringify({ error: "Only JPEG/JPG image bytes are accepted." }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const up = await fetch(
      `${SUPABASE_URL}/storage/v1/object/kyc-documents/${encodeURI(path)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
          "Content-Type": "image/jpeg",
          "x-upsert": "true",
        },
        body,
      }
    );
    if (!up.ok) {
      const t = await up.text();
      return new Response(JSON.stringify({ error: t || up.statusText }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ path, bucket: "kyc-documents" }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});

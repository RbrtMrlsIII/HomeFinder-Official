// Builds the bridge dependencies from the Edge environment. Secrets are read here and nowhere else.
//
// Required secrets:   FIREBASE_SERVICE_ACCOUNT_JSON, PAYPAL_SUBSCRIPTION_CLIENT_ID,
//                     PAYPAL_SUBSCRIPTION_CLIENT_SECRET, PAYPAL_SUBSCRIPTION_WEBHOOK_ID
// Optional settings:  PAYPAL_API_BASE   (default: SANDBOX https://api-m.sandbox.paypal.com;
//                                        set https://api-m.paypal.com only for production)
//                     PAYPAL_PLAN_ID    (default: the HomeFinder live plan; set the sandbox plan id for sandbox)
//                     ALLOWED_ORIGINS   (comma separated; default: the GitHub Pages origin)
import { verifyFirebaseIdToken, FIREBASE_PROJECT_ID } from "../firebase-auth.ts";
import { makeServiceAccountTokenProvider } from "../google-token.ts";
import { createFirestore } from "./firestore.mjs";
import { createPayPal, SANDBOX_API } from "./paypal.mjs";
import { HOMEFINDER_PLAN_ID } from "./core.mjs";

let cached: Record<string, unknown> | null = null;

export function getDeps() {
  if (cached) return cached;
  const env = (name: string) => Deno.env.get(name) || "";
  const allowed = (env("ALLOWED_ORIGINS") || "https://rbrtmrlsiii.github.io")
    .split(",").map((s) => s.trim()).filter(Boolean);
  cached = {
    fs: createFirestore({
      projectId: FIREBASE_PROJECT_ID,
      databaseId: "homefinder",
      getToken: makeServiceAccountTokenProvider(env("FIREBASE_SERVICE_ACCOUNT_JSON")),
    }),
    paypal: createPayPal({
      apiBase: env("PAYPAL_API_BASE") || SANDBOX_API,
      clientId: env("PAYPAL_SUBSCRIPTION_CLIENT_ID"),
      clientSecret: env("PAYPAL_SUBSCRIPTION_CLIENT_SECRET"),
      webhookId: env("PAYPAL_SUBSCRIPTION_WEBHOOK_ID"),
    }),
    planId: env("PAYPAL_PLAN_ID") || HOMEFINDER_PLAN_ID,
    now: () => new Date(),
    allowedOrigins: allowed,
    verifyIdToken: async (token: string) => {
      const payload = await verifyFirebaseIdToken(token);
      return { uid: String(payload.sub || ""), email: String(payload.email || "") };
    },
  };
  return cached;
}

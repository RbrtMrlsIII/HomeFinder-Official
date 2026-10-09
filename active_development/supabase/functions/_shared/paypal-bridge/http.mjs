// HTTP layer for the Edge bridge: CORS allowlist, auth, suspension parity, generic errors.
import { BridgeError, recordApproval, requireActiveUser, handleWebhook } from './core.mjs';

const HTTP_STATUS = {
  'invalid-argument': 400,
  unauthenticated: 401,
  'permission-denied': 403,
  'not-found': 404,
  'already-exists': 409,
  'failed-precondition': 412,
  internal: 500
};

function corsFor(origin, allowed) {
  if (!origin) return {}; // not a browser request
  if (!allowed.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

const json = (status, body, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...headers, 'Content-Type': 'application/json' }
});

/**
 * deps: { fs, paypal, planId, now, allowedOrigins, verifyIdToken(token) -> { uid, email } }
 * Browser callers must come from an allowed origin; server-to-server callers send no Origin.
 */
export async function handleApprovalRequest(req, deps) {
  const origin = req.headers.get('Origin');
  const cors = corsFor(origin, deps.allowedOrigins || []);
  if (cors === null) return json(403, { error: { code: 'permission-denied', message: 'Origin not allowed.' } });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json(405, { error: { code: 'method-not-allowed', message: 'POST only.' } }, cors);

  try {
    const auth = req.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) throw new BridgeError('unauthenticated', 'Sign in required.');
    let identity;
    try { identity = await deps.verifyIdToken(token); } catch { throw new BridgeError('unauthenticated', 'Invalid or expired sign-in.'); }
    const uid = String(identity?.uid || '');
    if (!uid) throw new BridgeError('unauthenticated', 'Invalid or expired sign-in.');

    await requireActiveUser(deps, uid);

    let body;
    try { body = await req.json(); } catch { throw new BridgeError('invalid-argument', 'Invalid JSON body.'); }
    const result = await recordApproval({ uid, email: identity.email || '', subscriptionId: String(body?.subscriptionId || '') }, deps);
    return json(200, result, cors);
  } catch (error) {
    if (error instanceof BridgeError) {
      return json(HTTP_STATUS[error.code] || 500, { error: { code: error.code, message: error.message } }, cors);
    }
    console.error('paypal-record-approval', error?.message || error);
    return json(500, { error: { code: 'internal', message: 'Unexpected error.' } }, cors);
  }
}

/** PayPal calls this server-to-server: no CORS, signature verification decides everything. */
export async function handleWebhookRequest(req, deps) {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  const rawBody = await req.text();
  const result = await handleWebhook({ headers: req.headers, rawBody }, deps);
  return new Response(result.body, { status: result.status });
}

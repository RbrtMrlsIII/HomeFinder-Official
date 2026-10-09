// PayPal REST client for the Supabase Edge bridge. Web APIs only (Deno and Node).
// The API base is configurable and defaults to the SANDBOX; production must opt in explicitly.

export const SANDBOX_API = 'https://api-m.sandbox.paypal.com';
export const LIVE_API = 'https://api-m.paypal.com';

/**
 * @param {{ apiBase?: string, clientId?: string, clientSecret?: string, webhookId?: string, fetchImpl?: typeof fetch }} [options]
 */
export function createPayPal({ apiBase = SANDBOX_API, clientId, clientSecret, webhookId, fetchImpl = fetch } = {}) {
  const base = String(apiBase).replace(/\/+$/, '');
  let cached = null;

  async function accessToken() {
    if (cached && cached.expiresAt > Date.now() + 30_000) return cached.token;
    if (!clientId || !clientSecret) throw new Error('PayPal credentials are not configured.');
    const res = await fetchImpl(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials'
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.access_token) throw new Error(`PayPal OAuth failed (${res.status}).`);
    cached = { token: body.access_token, expiresAt: Date.now() + (Number(body.expires_in) || 300) * 1000 };
    return cached.token;
  }

  return {
    apiBase: base,
    async getSubscription(subscriptionId) {
      const id = String(subscriptionId || '').trim();
      if (!/^I-[A-Z0-9]+$/i.test(id)) throw new Error('Invalid PayPal subscription ID.');
      const token = await accessToken();
      const res = await fetchImpl(`${base}/v1/billing/subscriptions/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`PayPal subscription lookup failed (${res.status}).`);
      if (String(body.id || '') !== id) throw new Error('PayPal subscription identity mismatch.');
      return body;
    },
    /** headers: a Fetch API Headers object. Throws unless PayPal reports SUCCESS. */
    async verifyWebhook(headers, rawBody) {
      if (!webhookId) throw new Error('PayPal webhook id is not configured.');
      const token = await accessToken();
      const res = await fetchImpl(`${base}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_algo: headers.get('paypal-auth-algo'),
          cert_url: headers.get('paypal-cert-url'),
          transmission_id: headers.get('paypal-transmission-id'),
          transmission_sig: headers.get('paypal-transmission-sig'),
          transmission_time: headers.get('paypal-transmission-time'),
          webhook_id: webhookId,
          webhook_event: JSON.parse(rawBody)
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.verification_status !== 'SUCCESS') throw new Error(`PayPal webhook verification failed (${res.status}).`);
    }
  };
}

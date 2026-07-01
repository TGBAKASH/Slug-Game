/* ═══════════════════════════════════════════════════════════════
   HMAC Request Signing — prevents API abuse
   
   Every state-changing request (earn, spend, energy/use) is signed
   with a shared secret. The server rejects unsigned requests.
   ═══════════════════════════════════════════════════════════════ */

const API_SECRET = import.meta.env.VITE_API_SECRET || '';

/**
 * Sign a request body with HMAC-SHA256.
 * Adds `_ts` (timestamp) and `_sig` (signature) to the body.
 */
export async function signRequest(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ts = Date.now();
  const message = JSON.stringify(body) + ts;
  
  // Use Web Crypto API (available in all modern browsers)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const sig = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return { ...body, _ts: ts, _sig: sig };
}

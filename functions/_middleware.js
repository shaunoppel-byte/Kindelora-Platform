// KINDELORA launch guard. Public Monday page is a sanitised teaser.
// Do NOT publish premium payloads under static paths. A real PLUS entitlement
// service must replace this deny-by-default policy before paid launch.
const protectedPaths = [
  /^\/(?:api\/)?(?:finance|owner-finance|admin-finance)(?:\/|$)/i,
  /^\/assets\/audio\/heygen-speech-2\.mp3$/i,
  /^\/(?:api\/)?(?:plus|premium|members)(?:\/|$)/i,
  /^\/assets\/(?:plus|premium|members)(?:\/|$)/i
];
export async function onRequest(context) {
  const rawPath = new URL(context.request.url).pathname;
  // Decode once for matching: percent-encoded path segments must not bypass
  // PLUS namespace protection. Fail closed on malformed path encodings.
  // Reject ambiguous encoded separators and double encoding before any routing.
  if (/%(?:2f|5c|25|00)/i.test(rawPath)) return new Response('Invalid request path.', {status: 400, headers: {'Cache-Control':'no-store, private'}});
  let path;
  try { path = decodeURIComponent(rawPath); }
  catch { return new Response('Invalid request path.', {status: 400, headers: {'Cache-Control':'no-store, private'}}); }
  // Repeated encoding is ambiguous across proxies; deny instead of passing
  // a potentially protected path through to the static asset handler.
  if (/%(?:2f|5c|25|00)/i.test(path)) return new Response('Invalid request path.', {status: 400, headers: {'Cache-Control':'no-store, private'}});
  // Public, non-sensitive readiness endpoint. Never exposes member data or secrets.
  // Merchant activation was confirmed by the founder on 2026-11-19. Checkout remains disabled until server-side payment and entitlement verification exist.
  if (path === '/api/plus/status') {
    return new Response(JSON.stringify({
      checkoutAvailable: false,
      membershipVerificationAvailable: false,
      paymentProvider: 'PayFast',
      status: 'pending_secure_payment_integration'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
  if (!protectedPaths.some(re => re.test(path))) return context.next();
  return new Response("KINDELORA PLUS access requires verified membership and is not yet available.", {
    status: 403,
    headers: {"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store, private","X-Robots-Tag":"noindex, nofollow"}
  });
}

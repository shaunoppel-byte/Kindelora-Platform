// KINDELORA launch guard. Public Monday page is a sanitised teaser.
// Do NOT publish premium payloads under static paths. A real PLUS entitlement
// service must replace this deny-by-default policy before paid launch.
const protectedPaths = [
  /^\/assets\/audio\/heygen-speech-2\.mp3$/i,
  /^\/(?:api\/)?(?:plus|premium|members)(?:\/|$)/i,
  /^\/assets\/(?:plus|premium|members)(?:\/|$)/i
];
export async function onRequest(context) {
  const path = new URL(context.request.url).pathname;
  // Public, non-sensitive readiness endpoint. Never exposes member data or secrets.
  // This is intentionally independent of PayFast until server-side verification exists.
  if (path === '/api/plus/status') {
    return new Response(JSON.stringify({
      checkoutAvailable: false,
      membershipVerificationAvailable: false,
      paymentProvider: 'PayFast',
      status: 'pending_merchant_verification'
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

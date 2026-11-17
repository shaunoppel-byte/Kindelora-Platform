// Fail closed for known premium media. The Monday HTML is a public, sanitised preview.
// Full reflections must never be placed in public static assets; future PLUS endpoints
// require authenticated server-side entitlement checks before enabling subscriptions.
const protectedPaths = [
  /^\/assets\/audio\/heygen-speech-2\.mp3$/i
];
export async function onRequest(context) {
  const path = new URL(context.request.url).pathname;
  if (!protectedPaths.some(re => re.test(path))) return context.next();
  return new Response("KINDELORA PLUS audio is unavailable until verified membership launch.", {
    status: 403,
    headers: {"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store, private","X-Robots-Tag":"noindex, nofollow"}
  });
}

// Fail-closed security gate: do not serve premium assets from public Pages or cache.
// TODO: replace with verified session + server-side PayFast entitlement before paid launch.
const protectedPaths = [
  /^\/motivational-monday(?:\.html|\/|$)/i,
  /^\/assets\/audio\/heygen-speech-2\.mp3$/i
];
export async function onRequest(context) {
  const path = new URL(context.request.url).pathname;
  if (!protectedPaths.some(re => re.test(path))) return context.next();
  return new Response("KINDELORA PLUS access is not yet available. Please return after verified membership launch.", {
    status: 403,
    headers: {"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store, private","X-Robots-Tag":"noindex, nofollow"}
  });
}

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
  if (!protectedPaths.some(re => re.test(path))) return context.next();
  return new Response("KINDELORA PLUS access requires verified membership and is not yet available.", {
    status: 403,
    headers: {"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store, private","X-Robots-Tag":"noindex, nofollow"}
  });
}

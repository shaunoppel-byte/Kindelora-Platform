// Security patch: v27 rejects ambiguous encoded paths and purges legacy caches.
const CACHE="kindelora-launch-v27";
const ASSETS=["/","/index.html","/app.js","/affirmation-preview.js","/member-favourites.js","/member-favourites.css","/message-catalogue.json","/manifest.webmanifest","/icon.svg","/privacy.html","/terms.html"];
// Match the server middleware's fail-closed path policy, including encoded paths.
// Do not allow an offline cache to serve a path the origin would reject.
const classifyPath=raw=>{
  if (/%(?:2f|5c|25)/i.test(raw)) return 'invalid';
  let path;
  try { path=decodeURIComponent(raw); } catch { return 'invalid'; }
  if (/%(?:2f|5c|25)/i.test(path)) return 'invalid';
  if (/^\/assets\/audio\/(?:heygen-speech-2|motivational-monday-2026-11-16-approved|motivational-monday-joanna)\.mp3$/i.test(path)||/^\/(?:api\/)?(?:plus|premium|members)(?:\/|$)/i.test(path)||/^\/assets\/(?:plus|premium|members)(?:\/|$)/i.test(path)) return 'protected';
  return 'public';
};
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{const req=event.request,url=new URL(req.url);if(url.origin!==self.location.origin||req.method!=="GET")return;const classification=classifyPath(url.pathname);if(classification==="invalid"){event.respondWith(Promise.resolve(new Response("Invalid request path.",{status:400,headers:{"Cache-Control":"no-store"}})));return;}if(url.pathname==="/api/plus/status")return;if(classification==="protected"){event.respondWith(Promise.resolve(new Response("PLUS content unavailable until membership verification.",{status:403,headers:{"Cache-Control":"no-store","Content-Type":"text/plain; charset=utf-8"}})));return;}if(req.mode==="navigate"){event.respondWith(fetch(req,{cache:"no-store"}).catch(()=>caches.match("/index.html")));return;}if(req.destination==="audio"||url.pathname.startsWith("/api/")||req.headers.has("Authorization"))return;event.respondWith(fetch(req).catch(()=>caches.match(req)));});

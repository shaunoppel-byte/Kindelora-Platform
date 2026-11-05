const CACHE="kindelora-launch-v10";
const ASSETS=["/","/index.html","/app.js","/member-favourites.js","/member-favourites.css","/message-catalogue.json","/manifest.webmanifest","/icon.svg","/sunrise-landscape.svg","/morning-light.svg","/calm-moment.svg","/reflect-grow.svg","/privacy.html","/terms.html"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("kindelora-launch-")&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()]))});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
 const path=new URL(request.url).pathname;
 if(request.mode==="navigate"){
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)))}return response}).catch(async()=>await caches.match(request)||await caches.match("/index.html")));
  return;
 }
 if(["/app.js","/member-favourites.js","/member-favourites.css","/manifest.webmanifest","/icon.svg","/privacy.html","/terms.html"].includes(path)){
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(path,copy)))}return response}).catch(()=>caches.match(path)));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)))}return response})));
});

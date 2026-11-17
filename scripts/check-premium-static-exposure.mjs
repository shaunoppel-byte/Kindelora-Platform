#!/usr/bin/env node
// P0 regression guard: checks known premium static leak paths.
// This does NOT replace live HTTP, entitlement or payment E2E testing.
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=read('motivational-monday.html');
const sw=read('sw.js');
const middleware=read('functions/_middleware.js');
const index=read('index.html');
// Public catalogue release guard: the app must accept exactly the shipped catalogue.
// This checks structural integrity, not independent editorial approval.
const catalogue=JSON.parse(read('message-catalogue.json'));
const appSource=read('app.js');
const favouritesSource=read('member-favourites.js');
const affirmationSource=read('affirmation-preview.js');

const catalogueMessages=Array.isArray(catalogue.messages)?catalogue.messages:[];
const validCatalogueMessages=catalogueMessages.filter(m=>m&&typeof m.id==='string'&&typeof m.theme==='string'&&typeof m.text==='string'&&m.text.length>=20&&m.text.length<=400);
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
assert(catalogue.count===3000&&catalogueMessages.length===3000,'Public catalogue count differs from 3000');
assert(validCatalogueMessages.length===3000,'Public catalogue contains invalid messages');
assert(new Set(validCatalogueMessages.map(m=>m.id)).size===3000,'Public catalogue contains duplicate IDs');
assert(appSource.includes('data.messages.length!==3000')&&appSource.includes('valid.length!==3000')&&appSource.includes('size!==3000'),'Public app loader rejects 3000-message catalogue');

// Paid favourites must stay a non-functional preview until server-side entitlement exists.
assert(favouritesSource.includes('gated preview'),'Favourites no longer explicitly labelled as a gated preview');
assert(favouritesSource.includes('membership required'),'Favourites no longer display a membership-required gate');
assert(!/localStorage\.getItem\([^)]*(?:plus|paid|member|subscription)/i.test(favouritesSource),'Favourites use localStorage as membership proof');
assert(!/localStorage\.getItem\([^)]*(?:plus|paid|member|subscription)/i.test(affirmationSource),'Affirmation preview uses localStorage as membership proof');
assert(!page.includes('The Difference You May Never See'),'Premium Monday full-message title leaked in public HTML');
assert(!page.includes('heygen-speech-2.mp3'),'Premium MP3 referenced from public HTML');
assert(!fs.existsSync(new URL('../assets/audio/heygen-speech-2.mp3',import.meta.url)),'Premium MP3 publicly hosted under static assets');
assert(!index.includes('heygen-speech-2.mp3'),'Homepage exposes premium MP3');
assert(!/const ASSETS=\[[^;]*motivational-monday\.html/s.test(sw),'Service worker precaches premium Monday HTML');

// Audit every explicit offline precache entry, not only the Monday page.
// A future developer must not accidentally cache premium assets or endpoints.
const precacheMatch=sw.match(/const ASSETS=(\[[^;]*\]);/s);
assert(Boolean(precacheMatch),'Service worker precache manifest missing');
if(precacheMatch){
 let entries=[];
 try{entries=JSON.parse(precacheMatch[1])}catch{assert(false,'Service worker precache manifest cannot be audited as JSON')}
 for(const asset of entries){
  const path=new URL(asset,'https://kindelora.pages.dev').pathname;
  assert(!/^\/(?:api\/)?(?:plus|premium|members)(?:\/|$)/i.test(path),'Protected namespace in offline precache: '+asset);
  assert(!/^\/assets\/(?:plus|premium|members)(?:\/|$)/i.test(path),'Protected asset in offline precache: '+asset);
  assert(!/^\/assets\/audio\/heygen-speech-2\.mp3$/i.test(path),'Protected Monday audio in offline precache');
  assert(path!=='/motivational-monday.html','Monday preview must not be precached while PLUS is gated');
 }
}
assert(sw.includes('keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))'),'Legacy caches are not purged on service worker activation');
assert(sw.includes('req.headers.has("Authorization")'),'Authenticated requests may be cached by service worker');
assert(sw.includes('const classifyPath=raw=>'),'Service worker does not classify encoded paths');
assert(sw.includes('classification==="invalid"'),'Service worker may replay ambiguous encoded paths');
assert(sw.includes('classification==="protected"'),'Service worker may replay protected PLUS routes');
assert(sw.includes('kindelora-launch-v27'),'Service worker cache version was not rotated after security hardening');

assert(middleware.includes('onRequest')&&middleware.includes('403'),'No fail-closed premium middleware');
assert(middleware.includes('(?:plus|premium|members)'),'Premium namespaces not denied by default');
assert(sw.includes('(?:plus|premium|members)'),'Offline premium namespaces not denied by default');
assert(sw.includes('url.pathname==="/api/plus/status"'),'Service worker blocks public PLUS readiness endpoint');
assert(!page.includes('play the professionally narrated recording.'),'Public preview falsely promises live audio');
assert(page.includes('currently withheld'),'Public Monday teaser is not in fail-closed state');

 // Execute the real Cloudflare Pages middleware with a mocked request.
 // This checks response statuses and bytes, rather than merely looking for a string.
const {onRequest}=await import('../functions/_middleware.js');
const protectedRoutes=[
 '/assets/audio/heygen-speech-2.mp3',
 '/api/plus/weekly',
 '/plus/archive',
 '/premium/downloads/reflection.pdf',
 '/members/favourites',
 '/assets/plus/private.mp3',
 '/assets/premium/secret.json'
];
for(const path of protectedRoutes){
 let nextCalled=false;
 const response=await onRequest({
   request:new Request('https://kindelora.pages.dev'+path),
   next:()=>{nextCalled=true;return new Response('PREMIUM_SECRET_SENTINEL')}
 });
 assert(!nextCalled&&response.status===403,'Protected path served: '+path);
 assert((response.headers.get('Cache-Control')||'').includes('no-store'),'Protected path cacheable: '+path);
 assert(!(await response.text()).includes('PREMIUM_SECRET_SENTINEL'),'Protected path leaked bytes: '+path);
}
// Exercise alternate HTTP methods, query parameters and case variants.
// Static and API paths must remain denied regardless of request method.
for(const method of ['GET','HEAD','POST','OPTIONS']){
 for(const path of ['/api/plus/weekly?preview=1','/PLUS/archive?download=true','/members/favourites?offline=1','/assets/plus/private.mp3?cache=1']){
  let nextCalled=false;
  const response=await onRequest({
   request:new Request('https://kindelora.pages.dev'+path,{method}),
   next:()=>{nextCalled=true;return new Response('PREMIUM_METHOD_BYPASS')}
  });
  assert(!nextCalled&&response.status===403,'Method/query bypass: '+method+' '+path);
  assert((response.headers.get('cache-control')||'').includes('no-store'),'Method/query response cacheable: '+method+' '+path);
  assert(!(await response.text()).includes('PREMIUM_METHOD_BYPASS'),'Method/query leaked content: '+method+' '+path);
 }
}
// Encoded URL segments must not bypass the same server-side deny policy.
for (const path of ['/api/%70lus/weekly','/%70lus/archive','/assets/%70remium/secret.json','/api/%2570lus/weekly','/api/%2fplus/weekly','/api/%00plus/weekly','/plus/%00archive']) {
 let nextCalled=false;
 const response=await onRequest({
  request:new Request('https://kindelora.pages.dev'+path),
  next:()=>{nextCalled=true;return new Response('ENCODED_PREMIUM_BYPASS')}
 });
 assert(!nextCalled && [400,403].includes(response.status),'Encoded path bypass: '+path);
 assert((response.headers.get('cache-control')||'').includes('no-store'),'Encoded path cacheable: '+path);
 assert(!(await response.text()).includes('ENCODED_PREMIUM_BYPASS'),'Encoded path leaked bytes: '+path);
}
// Issue #359: client-controlled cookies and headers must never grant PLUS access.
// This is a negative test, not evidence that paid entitlements are implemented.
const forgedIdentityHeaders=[
 {'Cookie':'kindelora_plus=true; plan=plus; subscription=active'},
 {'Authorization':'Bearer forged-test-token','X-User-Role':'plus'},
 {'X-Membership-Status':'active','X-Subscription-Tier':'paid'},
 {'Cookie':'session=forged; membership=verified','X-PayFast-Status':'COMPLETE'}
];
for(const [caseIndex,headers] of forgedIdentityHeaders.entries()){
 for(const path of ['/api/plus/weekly','/plus/archive','/members/favourites','/assets/plus/private.mp3']){
  let nextCalled=false;
  const response=await onRequest({
   request:new Request('https://kindelora.pages.dev'+path,{headers}),
   next:()=>{nextCalled=true;return new Response('FORGED_MEMBER_SECRET')}
  });
  assert(!nextCalled&&response.status===403,'Forged membership bypass case '+caseIndex+': '+path);
  assert((response.headers.get('cache-control')||'').includes('no-store'),'Forged membership response cacheable: '+path);
  assert(!(await response.text()).includes('FORGED_MEMBER_SECRET'),'Forged membership leaked content: '+path);
 }
}
// The route-level fallback must match middleware's public contract exactly.
// This prevents Cloudflare routing changes from exposing contradictory flags.
const {onRequestGet:statusFallback}=await import('../functions/api/plus/status.js');
const fallbackResponse=await statusFallback({});
assert(fallbackResponse.status===200,'PLUS status fallback not available');
assert((fallbackResponse.headers.get('cache-control')||'').includes('no-store'),'PLUS fallback response cacheable');
const fallbackData=await fallbackResponse.json();
assert(JSON.stringify(fallbackData)===JSON.stringify({
 checkoutAvailable:false,
 membershipVerificationAvailable:false,
 paymentProvider:'PayFast',
 status:'pending_merchant_verification'
}),'PLUS status fallback contract differs from middleware');
const readiness=await onRequest({
 request:new Request('https://kindelora.pages.dev/api/plus/status'),
 next:()=>new Response('UNEXPECTED_PUBLIC_FALLTHROUGH')
});
assert(readiness.status===200,'Public readiness endpoint not available');
assert((readiness.headers.get('cache-control')||'').includes('no-store'),'Readiness response cacheable');
const readinessData=await readiness.json();
assert(readinessData.checkoutAvailable===false&&readinessData.membershipVerificationAvailable===false,'Readiness incorrectly enables paid checkout');
let publicNext=false;
const publicResponse=await onRequest({
 request:new Request('https://kindelora.pages.dev/motivational-monday.html'),
 next:()=>{publicNext=true;return new Response('PUBLIC_SANITISED_PREVIEW')}
});
assert(publicNext&&publicResponse.status===200,'Public sanitised Monday preview is blocked');
console.log(JSON.stringify({check:'known premium static exposure',passed:failures.length===0,failures},null,2));
if(failures.length)process.exitCode=1;

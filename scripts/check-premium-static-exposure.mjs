#!/usr/bin/env node
// P0 regression guard: checks known premium static leak paths.
// This does NOT replace live HTTP, entitlement or payment E2E testing.
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=read('motivational-monday.html');
const sw=read('sw.js');
const middleware=read('functions/_middleware.js');
const index=read('index.html');
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
assert(!page.includes('The Difference You May Never See'),'Premium Monday full-message title leaked in public HTML');
assert(!page.includes('heygen-speech-2.mp3'),'Premium MP3 referenced from public HTML');
assert(!fs.existsSync(new URL('../assets/audio/heygen-speech-2.mp3',import.meta.url)),'Premium MP3 publicly hosted under static assets');
assert(!index.includes('heygen-speech-2.mp3'),'Homepage exposes premium MP3');
assert(!/const ASSETS=\[[^;]*motivational-monday\.html/s.test(sw),'Service worker precaches premium Monday HTML');
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

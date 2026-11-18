// Offline, zero-cost safety contract. No PayFast calls, credentials or customer data.
// This test must remain green while checkout is unavailable.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('functions/_middleware.js','utf8');
const {onRequest}=await import('data:text/javascript,'+encodeURIComponent(source));
async function request(path) {
  let passed=false;
  const response=await onRequest({
    request:new Request('https://kindelora.example'+path),
    next:()=>{passed=true;return new Response('public',{status:200});}
  });
  return {response,passed};
}
const status=await request('/api/plus/status');
assert.equal(status.response.status,200);
assert.equal(status.passed,false);
assert.match(status.response.headers.get('cache-control')||'',/no-store/);
const state=await status.response.json();
assert.deepEqual(state,{
  checkoutAvailable:false,
  membershipVerificationAvailable:false,
  paymentProvider:'PayFast',
  status:'pending_merchant_verification'
});
for(const path of [
 '/plus','/api/plus/checkout','/premium','/members/profile',
 '/assets/premium/private.json','/assets/members/content.json',
 '/finance','/api/owner-finance','/admin-finance',
 '/assets/audio/heygen-speech-2.mp3','/PLUS/checkout',
 '/%70lus','/api/%70lus/checkout'
]) {
  const {response,passed}=await request(path);
  assert.equal(passed,false,path+' must never reach static handler');
  assert.equal(response.status,403,path);
  assert.match(response.headers.get('cache-control')||'',/no-store/,path);
}
for(const path of ['/api/%2fplus/checkout','/api/%5cplus','/api/%252fplus','/api/%00plus']) {
  const {response,passed}=await request(path);
  assert.equal(passed,false,path);
  assert.equal(response.status,400,path);
}
for(const path of ['/','/about','/assets/css/site.css']) {
  const {response,passed}=await request(path);
  assert.equal(passed,true,path+' should remain public');
  assert.equal(response.status,200,path);
}
console.log('PASS: PayFast disabled, PLUS/finance fail-closed, encoded-path protections and public guest access');

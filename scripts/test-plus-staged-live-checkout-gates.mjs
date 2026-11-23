// Offline staged-live checkout checks. Never contacts PayFast or modifies D1.
import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/_lib/plus-live-checkout-orchestration-staged.js';
const url='https://kindelora.pages.dev/api/plus/checkout';
const req=(plan='monthly',origin='https://kindelora.pages.dev')=>new Request(url,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({plan})});
for(const method of ['GET','POST']){
 const result=method==='GET'?await onRequestGet():await onRequestPost({request:req(),env:{}});
 assert.equal(result.status,method==='GET'?405:503);
 assert.equal(result.headers.get('cache-control'),'no-store');
 assert.equal(result.headers.get('location'),null);
}
// Even a plausible merchant config must fail closed without an authenticated member backend.
const env={PAYFAST_LIVE_CHECKOUT_ENABLED:'true',PAYFAST_LIVE_ITN_ENABLED:'true',PAYFAST_LIVE_RECURRING_VERIFIED:'true'};
assert.equal((await onRequestPost({request:req(),env})).status,503);
// Never permit browser-supplied amount, payment token, or arbitrary host to bypass gates.
const response=await onRequestPost({request:req('annual','https://attacker.example'),env});
assert.equal(response.status,503);
console.log('PASS: staged checkout requires explicit gates; no charge or redirect without verified backend');

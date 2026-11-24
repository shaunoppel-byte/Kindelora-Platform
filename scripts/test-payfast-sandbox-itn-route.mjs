import assert from 'node:assert/strict';
import {onRequestPost,onRequestGet} from '../functions/api/plus/payfast-itn.js';
const request=new Request('https://kindelora.pages.dev/api/plus/payfast-itn',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'x=y'});
let r=await onRequestPost({request,env:{}});assert.equal(r.status,503);
r=await onRequestPost({request,env:{PAYFAST_SANDBOX_ITN_ENABLED:'true'}});assert.equal(r.status,503);
const primary={prepare(){},batch(){}};
for(const env of [
 {PAYFAST_SANDBOX_ITN_ENABLED:'true',DB:primary},
 {PAYFAST_SANDBOX_ITN_ENABLED:'true',PAYFAST_SANDBOX_ISOLATED_DB_ENABLED:'true',DB:primary},
 {PAYFAST_SANDBOX_ITN_ENABLED:'true',PAYFAST_SANDBOX_ISOLATED_DB_ENABLED:'true',DB:primary,PAYFAST_SANDBOX_DB:primary}
]){
 r=await onRequestPost({request,env});assert.equal(r.status,503);
 assert.equal((await r.json()).reason,'sandbox_database_unavailable');
}
r=await onRequestPost({request,env:{PAYFAST_SANDBOX_ITN_ENABLED:'true',PAYFAST_SANDBOX_ISOLATED_DB_ENABLED:'true',DB:primary,PAYFAST_SANDBOX_DB:{prepare(){},batch(){}}}});
assert.equal(r.status,503);assert.equal((await r.json()).reason,'sandbox_unconfigured');
r=await onRequestGet();assert.equal(r.status,405);
console.log('PASS: sandbox ITN route disabled by default; unsafe D1 isolation, missing configuration and GET fail closed');

const sandboxDb={prepare(){},batch(){}};
const diagnosticEnv={PAYFAST_SANDBOX_ITN_ENABLED:'true',PAYFAST_SANDBOX_ISOLATED_DB_ENABLED:'true',
 PAYFAST_SANDBOX_DB:sandboxDb,DB:{prepare(){},batch(){}},PAYFAST_SANDBOX_MERCHANT_ID:'10000100',
 PAYFAST_SANDBOX_PASSPHRASE:'server-only-passphrase',PAYFAST_SANDBOX_ALLOWED_CIDRS:'192.0.2.0/24'};
const rejectedRequest=new Request('https://kindelora.pages.dev/api/plus/payfast-itn',{method:'POST',
 headers:{'content-type':'application/x-www-form-urlencoded'},body:'invalid=payload'});
const originalWarn=console.warn;
const logs=[];
console.warn=(...args)=>logs.push(args);
try{
 r=await onRequestPost({request:rejectedRequest,env:diagnosticEnv});
 assert.equal(r.status,403);
 assert.equal((await r.json()).reason,'notification_rejected','keep provider-facing error generic');
 assert.deepEqual(logs,[['[payfast-sandbox-itn] notification rejected',{reason:'invalid_envelope'}]],
  'log only the safe stage reason, never the raw callback');
}finally{console.warn=originalWarn;}
console.log('PASS: rejected Sandbox ITN keeps a generic public response and emits only a sanitized diagnostic reason');

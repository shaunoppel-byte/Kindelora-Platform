import assert from 'node:assert/strict';
import {onRequestPost,onRequestGet} from '../functions/api/plus/payfast-live-itn.js';
const request=new Request('https://kindelora.pages.dev/api/plus/payfast-live-itn',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'payment_status=COMPLETE'});
let r=await onRequestPost({request,env:{}});assert.equal(r.status,503);assert.equal((await r.json()).reason,'live_itn_disabled');
r=await onRequestPost({request,env:{PAYFAST_LIVE_ITN_ENABLED:'true'}});assert.equal(r.status,503);assert.equal((await r.json()).reason,'live_itn_unconfigured');
r=await onRequestGet();assert.equal(r.status,405);

const configured={PAYFAST_LIVE_ITN_ENABLED:'true',PAYFAST_LIVE_MERCHANT_ID:'10000100',PAYFAST_LIVE_PASSPHRASE:'server-only-passphrase',PAYFAST_LIVE_ALLOWED_CIDRS:'192.0.2.0/24',DB:{prepare(){throw Error('database should not be reached')},batch(){throw Error('database should not be reached')}}};
const post=(body,headers={})=>new Request('https://kindelora.pages.dev/api/plus/payfast-live-itn',{method:'POST',headers,body});
r=await onRequestPost({request:post('payment_status=COMPLETE',{'content-type':'application/json'}),env:configured});
assert.equal(r.status,415);
r=await onRequestPost({request:post('x'.repeat(16385),{'content-type':'application/x-www-form-urlencoded'}),env:configured});
assert.equal(r.status,400); // Missing Content-Length; oversized body rejected after reading.
const oversizedWithLength={headers:{get(name){return name==='content-type'?'application/x-www-form-urlencoded':name==='content-length'?'16385':null}},async text(){throw Error('body must not be read')}};
r=await onRequestPost({request:oversizedWithLength,env:configured});assert.equal(r.status,413);
r=await onRequestPost({request:post('payment_status=COMPLETE',{'content-type':'application/x-www-form-urlencoded'}),env:configured});
assert.equal(r.status,503);
assert.equal((await r.json()).reason,'live_d1_schema_unavailable');

console.log('PASS: live ITN route disabled by default and fails closed without server configuration');

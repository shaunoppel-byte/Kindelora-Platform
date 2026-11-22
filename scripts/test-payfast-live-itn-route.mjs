import assert from 'node:assert/strict';
import {onRequestPost,onRequestGet} from '../functions/api/plus/payfast-live-itn.js';
const request=new Request('https://kindelora.pages.dev/api/plus/payfast-live-itn',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'payment_status=COMPLETE'});
let r=await onRequestPost({request,env:{}});assert.equal(r.status,503);assert.equal((await r.json()).reason,'live_itn_disabled');
r=await onRequestPost({request,env:{PAYFAST_LIVE_ITN_ENABLED:'true'}});assert.equal(r.status,503);assert.equal((await r.json()).reason,'live_itn_unconfigured');
r=await onRequestGet();assert.equal(r.status,405);
console.log('PASS: live ITN route disabled by default and fails closed without server configuration');

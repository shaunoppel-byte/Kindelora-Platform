import assert from 'node:assert/strict';
import {onRequestPost,onRequestGet} from '../functions/api/plus/payfast-itn.js';
const request=new Request('https://kindelora.pages.dev/api/plus/payfast-itn',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'x=y'});
let r=await onRequestPost({request,env:{}});assert.equal(r.status,503);
r=await onRequestPost({request,env:{PAYFAST_SANDBOX_ITN_ENABLED:'true'}});assert.equal(r.status,503);
r=await onRequestGet();assert.equal(r.status,405);
console.log('PASS: sandbox ITN route disabled by default; missing configuration and GET fail closed');

import assert from 'node:assert/strict';
import {onRequestPost,onRequestGet} from '../functions/api/plus/sandbox-checkout.js';
const request=new Request('https://kindelora.pages.dev/api/plus/sandbox-checkout',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({plan:'monthly'})});
let result=await onRequestPost({request,env:{}});assert.equal(result.status,503);
result=await onRequestGet();assert.equal(result.status,405);
console.log('PASS: sandbox checkout disabled by default; GET denied');

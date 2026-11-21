// Offline guard: even authenticated-looking checkout POST must never create a charge.
import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/api/plus/checkout.js';
for(const [method,handler] of [['GET',onRequestGet],['POST',onRequestPost]]){
 const response=await handler({
  request:new Request('https://kindelora.pages.dev/api/plus/checkout',{
   method,headers:{origin:'https://kindelora.pages.dev','content-type':'application/json',cookie:'kindelora_session=synthetic-only'},
   ...(method==='POST'?{body:JSON.stringify({plan:'annual',amount:0,merchant:'forged',paymentToken:'synthetic'})}:{})
  }),
  env:new Proxy({}, {get(){throw Error('checkout must not access payment credentials or database while disabled');}})
 });
 assert.equal(response.status,503,method+' checkout must remain fail-closed');
 assert.match(response.headers.get('cache-control')||'',/no-store/i);
 assert.equal(response.headers.get('set-cookie'),null);
 assert.equal((await response.json()).error,'checkout_unavailable');
}
console.log('PASS: offline GET/POST checkout remains 503 even with forged plan and synthetic session; no payment calls or writes');

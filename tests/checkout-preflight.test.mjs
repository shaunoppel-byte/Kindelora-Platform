import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {webcrypto} from 'node:crypto';
import {onRequestPost,onRequestGet} from '../functions/api/checkout-preflight.js';
if (!globalThis.crypto) globalThis.crypto=webcrypto;
const pepper='a'.repeat(40);
function request(body,opts={}) {
  return new Request('https://kindelora.pages.dev/api/checkout-preflight',{
    method:'POST',
    headers:{'content-type':'application/json','origin':opts.origin||'https://kindelora.pages.dev',...(opts.cookie?{cookie:opts.cookie}:{})},
    body:typeof body==='string'?body:JSON.stringify(body)
  });
}
function env(session) {
  return {
    MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper,
    DB:{prepare(sql){return {bind(...args){return {async first(){return session||null}}}}}}
  };
}
test('GET cannot initiate payment',async()=>{const r=await onRequestGet();assert.equal(r.status,405)});
test('missing member session denied before plan selection',async()=>{
  const r=await onRequestPost({request:request({plan:'monthly'}),env:env(null)});
  assert.equal(r.status,401);assert.equal((await r.json()).error,'sign_in_required');
});
test('cross-site origin denied',async()=>{
  const r=await onRequestPost({request:request({plan:'monthly'},{origin:'https://attacker.example'}),env:env(null)});
  assert.equal(r.status,403);
});
test('missing auth configuration fails closed',async()=>{
  const r=await onRequestPost({request:request({plan:'monthly'}),env:{}});
  assert.equal(r.status,503);
});
test('verified member receives server-side plan price, never client-supplied amount',async()=>{
  const cookie='kindelora_session='+ 'b'.repeat(64);
  const r=await onRequestPost({request:request({plan:'annual',amount:0,currency:'ZAR'},{cookie}),env:env({id:'member1',email_normalized:'test@example.com',email_verified_at:'2026-11-20'})});
  assert.equal(r.status,200);
  const body=await r.json();
  assert.equal(body.displayAmount,'89.99');assert.equal(body.displayCurrency,'USD');
  assert.equal(body.checkoutAvailable,false);assert.equal(body.paymentTaken,false);
  assert.equal(body.settlementQuoteAvailable,false);
});
test('unknown plan rejected for authenticated member',async()=>{
  const cookie='kindelora_session='+ 'b'.repeat(64);
  const r=await onRequestPost({request:request({plan:'free'},{cookie}),env:env({id:'member1'})});
  assert.equal(r.status,400);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet,onRequestPost} from '../functions/api/plus/checkout.js';

for(const [method,handler] of [['GET',onRequestGet],['POST',onRequestPost]]){
 test('unverified PLUS '+method+' checkout fails closed without payment or entitlement',async()=>{
  const result=await handler({request:new Request('https://kindelora.pages.dev/api/plus/checkout',{method}),env:{}});
  assert.equal(result.status,503);
  assert.equal(result.headers.get('cache-control'),'no-store');
  assert.equal(result.headers.get('x-content-type-options'),'nosniff');
  const body=await result.json();
  assert.equal(body.error,'checkout_unavailable');
  assert.match(body.message,/No payment was taken/i);
 });
}

// node --test tests/p0-checkout-production-failclosed.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const path='functions/api/plus/checkout.js';
const source=readFileSync(path,'utf8');
const encoded='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const {onRequestPost,onRequestGet}=await import(encoded);
for(const [method,handler] of [['POST',onRequestPost],['GET',onRequestGet]]){
 test('production checkout '+method+' always fails closed without charging',async()=>{
  const response=await handler({request:new Request('https://kindelora.pages.dev/api/plus/checkout',{method}),env:{PAYFAST_MODE:'live',PAYFAST_MERCHANT_ID:'synthetic',PAYFAST_MERCHANT_KEY:'synthetic'}});
  assert.equal(response.status,503);
  assert.equal(response.headers.get('cache-control'),'no-store');
  const payload=await response.json();
  assert.equal(payload.error,'checkout_unavailable');
  assert.match(payload.message,/No payment was taken/i);
  assert.equal(response.headers.get('location'),null);
 });
}
test('production checkout source does not invoke a payment provider or grant entitlements',()=>{
 assert.doesNotMatch(source,/fetch\\s*\\(/);
 assert.doesNotMatch(source,/env\\.DB|\.prepare\\s*\\(/);
 assert.doesNotMatch(source,/302|303|307|308/);
});

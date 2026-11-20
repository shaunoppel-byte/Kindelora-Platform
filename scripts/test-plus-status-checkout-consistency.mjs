import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet as getStatus} from '../functions/api/plus/status.js';
import {onRequestGet as getCheckout,onRequestPost as postCheckout} from '../functions/api/plus/checkout.js';

test('PLUS public status must never advertise active checkout while checkout is blocked',async()=>{
 const statusResponse=await getStatus();
 assert.equal(statusResponse.status,200);
 assert.match(statusResponse.headers.get('cache-control')||'',/no-store/);
 const status=await statusResponse.json();
 for(const method of [getCheckout,postCheckout]){
  const checkout=await method();
  assert.equal(checkout.status,503);
  const body=await checkout.json();
  assert.equal(body.error,'checkout_unavailable');
  assert.equal(status.checkoutAvailable,false);
  assert.equal(status.membershipVerificationAvailable,false);
  assert.equal(status.status,'pending_secure_payment_integration');
 }
});

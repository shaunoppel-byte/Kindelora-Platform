import assert from 'node:assert/strict';
import {verifyPersistedLivePaymentFacts} from '../functions/_lib/payfast-live-persisted-payment-facts.js';

// Characterisation only: demonstrates current renewal blocker without charging,
// changing the production code path, or granting PLUS.
const merchantReference='kin_order_12345678';
const providerTransactionId='pf_renewal_12345678';
const order={
  id:merchantReference,customer_id:'kin_customer_12345678',
  amount_minor:16500,currency:'ZAR',status:'paid',plan_id:'monthly',
  display_usd_minor:899,settlement_zar_minor:16500,
  expires_at:'2026-12-01T00:00:00.000Z'
};
let queries=0;
const db={prepare(sql){
  queries++;
  return {bind(){return {async first(){
    if(sql.includes('FROM plus_orders'))return order;
    if(sql.includes('FROM plus_payment_events'))return null;
    throw Error('Unexpected SQL');
  }}}};
}};
const result=await verifyPersistedLivePaymentFacts({
  db,merchantReference,merchantId:'10000100',expectedMerchantId:'10000100',
  paidZarMinor:16500,providerTransactionId,paymentStatus:'COMPLETE',
  nowMs:Date.parse('2026-12-22T10:00:00Z')
});
assert.equal(result.verified,false);
assert.equal(result.reason,'order_mismatch');
assert.equal(result.grantEntitlement,false);
assert.equal(queries,1,'Renewal is rejected before replay detection');
console.log('PASS: characterised existing paid-order renewal rejection; NOT a renewal fix or payment test');

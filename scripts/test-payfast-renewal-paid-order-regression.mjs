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
// Initial COMPLETE ITN with a pending order remains eligible for reconciliation.
async function probe(status,duplicate,amount=16500){
  let count=0;
  const testDb={prepare(sql){
    count++;
    return {bind(){return {async first(){
      if(sql.includes('FROM plus_orders'))return {...order,status};
      if(sql.includes('FROM plus_payment_events'))return duplicate?{order_id:merchantReference}:null;
      throw Error('Unexpected SQL');
    }}}};
  }};
  const result=await verifyPersistedLivePaymentFacts({
    db:testDb,merchantReference,merchantId:'10000100',expectedMerchantId:'10000100',
    paidZarMinor:amount,providerTransactionId,paymentStatus:'COMPLETE',
    nowMs:Date.parse('2026-12-22T10:00:00Z')
  });
  return {result,count};
}
const initial=await probe('pending',false);
assert.equal(initial.result.verified,true);
assert.equal(initial.result.grantEntitlement,false);
assert.equal(initial.count,2);
const replay=await probe('pending',true);
assert.equal(replay.result.verified,false);
assert.equal(replay.result.reason,'provider_reference_already_recorded');
const drift=await probe('pending',false,16499);
assert.equal(drift.result.verified,false);
assert.equal(drift.result.reason,'order_mismatch');
const wrongMerchant=await verifyPersistedLivePaymentFacts({
  db,merchantReference,merchantId:'10000101',expectedMerchantId:'10000100',
  paidZarMinor:16500,providerTransactionId,paymentStatus:'COMPLETE'
});
assert.equal(wrongMerchant.verified,false);
assert.equal(wrongMerchant.reason,'invalid_payment_facts');
console.log('PASS: pending initial accepted, replay/amount/merchant rejected, paid renewal blocked; no charges or entitlement');

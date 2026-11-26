import assert from 'node:assert/strict';
import {verifyPersistedLivePaymentFacts} from '../functions/_lib/payfast-live-persisted-payment-facts.js';
const order={id:'order_123',customer_id:'customer_123',amount_minor:15909,currency:'ZAR',status:'pending',plan_id:'monthly',display_usd_minor:899,settlement_zar_minor:15909,expires_at:'2026-11-26T00:00:00Z'};
const db={prepare(sql){return {bind(){return {async first(){return sql.includes('plus_orders')?order:null}}}}}};
const input={db,merchantReference:order.id,merchantId:'12345678',expectedMerchantId:'12345678',paidZarMinor:15909,paymentStatus:'COMPLETE',nowMs:1795651200000};
for(const id of ['2052024','2052026','12345678']){const r=await verifyPersistedLivePaymentFacts({...input,providerTransactionId:id});assert.equal(r.verified,true);assert.equal(r.grantEntitlement,false);assert.equal(r.order.providerTransactionId,id)}
for(const id of ['123456','123 456',''])assert.equal((await verifyPersistedLivePaymentFacts({...input,providerTransactionId:id})).verified,false);
assert.equal((await verifyPersistedLivePaymentFacts({...input,merchantReference:'1234567',providerTransactionId:'2052024'})).verified,false);
assert.equal((await verifyPersistedLivePaymentFacts({...input,paidZarMinor:15910,providerTransactionId:'2052024'})).verified,false);
console.log('PASS: provider reference length, merchant reference and amount checks');

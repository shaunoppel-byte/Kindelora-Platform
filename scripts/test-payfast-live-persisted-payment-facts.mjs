import assert from 'node:assert/strict';
import {verifyPersistedLivePaymentFacts as verify} from '../functions/_lib/payfast-live-persisted-payment-facts.js';
const row={id:'order_12345678',customer_id:'customer_12345678',amount_minor:16500,currency:'ZAR',status:'pending',plan_id:'monthly',display_usd_minor:899,settlement_zar_minor:16500,expires_at:'2026-11-22T12:00:00Z'};
const dbFor=(order=row,duplicate=null)=>({prepare(sql){return {bind(){return {async first(){return sql.includes('plus_payment_events')?duplicate:order}}}}}});
const args={db:dbFor(),merchantReference:row.id,merchantId:'10000100',expectedMerchantId:'10000100',paidZarMinor:16500,providerTransactionId:'provider_12345678',paymentStatus:'COMPLETE',nowMs:Date.parse('2026-11-22T13:00:00Z')};
let r=await verify(args);assert.equal(r.verified,true);assert.equal(r.grantEntitlement,false);assert.equal(r.order.customerId,row.customer_id);
for(const override of [{merchantId:'10000101'},{paidZarMinor:16501},{paymentStatus:'PENDING'},{providerTransactionId:'bad'},{db:dbFor({...row,status:'paid'})},{db:dbFor({...row,customer_id:'other'})},{db:dbFor({...row,display_usd_minor:900})},{db:dbFor({...row,settlement_zar_minor:16501})},{db:dbFor(row,{order_id:row.id})}]){
 r=await verify({...args,...override});assert.equal(r.verified,false);assert.equal(r.grantEntitlement,false);
}
r=await verify({...args,db:dbFor({...row,status:'paid'})});\nassert.equal(r.reason,'renewal_requires_verified_recurring_link');\nassert.equal(r.verified,false);\nassert.equal(r.grantEntitlement,false);\nconsole.log('PASS: live payment reconciliation checks D1 order, quote, merchant, amount and replay');

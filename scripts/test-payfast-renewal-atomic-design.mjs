import assert from 'node:assert/strict';
import {prepareAtomicPayFastRenewal as prepare} from '../functions/_lib/payfast-live-renewal-atomic-design.js';

// Contract tests for a deliberately non-executable renewal design.
// No PayFast calls, D1 mutations, or membership activation.
function fakeDb(){
 const prepared=[];
 return {prepared,prepare(sql){const stmt={sql,bind(...values){this.values=values;return this}};prepared.push(stmt);return stmt}};
}
const renewal={ready:true,execute:false,grantEntitlement:false,renewal:{
 orderId:'kin_order_12345678',customerId:'kin_customer_12345678',
 subscriptionId:'sub_1234567890123456',providerTransactionId:'pf_renewal_12345678',
 plan:'monthly',amountMinor:16500,previousPeriodEnd:'2026-12-22T10:00:00.000Z'
}};
const db=fakeDb();
const plan=prepare({db,verifiedRenewal:renewal,paidAt:'2026-12-22T10:00:00.000Z'});
assert.equal(plan.ready,false);
assert.equal(plan.execute,false);
assert.equal(plan.grantEntitlement,false);
assert.deepEqual(plan.statements,[]);
assert.equal(plan.proposedStatements.length,4);
assert.equal(plan.periodEnd,'2027-01-22T10:00:00.000Z');
assert.match(db.prepared[0].sql,/INSERT INTO plus_payfast_renewal_events/);
assert.match(db.prepared[0].sql,/NOT EXISTS/);
assert.match(db.prepared[1].sql,/UPDATE plus_subscriptions/);
assert.match(db.prepared[1].sql,/current_period_end=\?/);
assert.equal(prepare({db,verifiedRenewal:{...renewal,ready:false},paidAt:'2026-12-22T10:00:00.000Z'}),null);
assert.equal(prepare({db,verifiedRenewal:{...renewal,execute:true},paidAt:'2026-12-22T10:00:00.000Z'}),null);
assert.equal(prepare({db,verifiedRenewal:{...renewal,grantEntitlement:true},paidAt:'2026-12-22T10:00:00.000Z'}),null);
assert.equal(prepare({db,verifiedRenewal:{...renewal,renewal:{...renewal.renewal,amountMinor:0}},paidAt:'2026-12-22T10:00:00.000Z'}),null);
console.log('PASS: renewal design stays non-executable and rejects untrusted inputs');

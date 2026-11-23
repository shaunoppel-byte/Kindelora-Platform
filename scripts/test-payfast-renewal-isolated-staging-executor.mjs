import assert from 'node:assert/strict';
import {executeIsolatedPayFastRenewalStaging as execute} from '../functions/_lib/payfast-renewal-isolated-staging-executor.js';
let writes=0;
const db={prepare(sql){return {sql,bind(...args){this.args=args;return this}}},async batch(statements){writes++;assert.equal(statements.length,6);return statements.map((_,i)=>({success:true,meta:{changes:i===0||i===3?1:0}}))}};
const verifiedRenewal={ready:true,execute:false,grantEntitlement:false,renewal:{
 orderId:'kin_order_12345678',customerId:'kin_customer_12345678',
 subscriptionId:'sub_1234567890123456',providerTransactionId:'pf_renewal_12345678',
 plan:'monthly',providerSubscriptionToken:'token_12345678',amountMinor:16500,previousPeriodEnd:'2026-12-22T10:00:00.000Z'
}};
const args={db,verifiedRenewal,paidAt:'2026-12-22T10:00:00.000Z'};
assert.equal((await execute(args)).committed,false);
assert.equal(writes,0);
assert.equal((await execute({...args,stagingOnly:true,verifiedRenewal:{...verifiedRenewal,ready:false}})).committed,false);
assert.equal(writes,0);
const result=await execute({...args,stagingOnly:true});
assert.equal(result.committed,true);
assert.equal(result.grantEntitlement,false);
assert.equal(result.periodEnd,'2027-01-22T10:00:00.000Z');
assert.equal(writes,1);
const failed=await execute({...args,stagingOnly:true,db:{...db,async batch(){throw Error('constraint rollback')}}});
assert.equal(failed.committed,false);
assert.equal(failed.grantEntitlement,false);
console.log('PASS: staging-only renewal executor requires verified preflight, explicit opt-in and one guarded batch; no entitlement grant');

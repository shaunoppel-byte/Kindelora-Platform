import assert from 'node:assert/strict';
import {executeIsolatedInitialRecurringStaging as execute} from '../functions/_lib/payfast-initial-recurring-isolated-staging-executor.js';
let calls=0,fail=false;
const db={prepare(sql){return {bind(...args){return {sql,args};}}},async batch(statements){calls++;assert.equal(statements.length,5);if(fail)throw Error('atomic rollback');return statements.map(()=>({success:true,meta:{changes:1}}));}};
const payment={verified:true,environment:'live',paymentStatus:'COMPLETE',orderId:'order_12345678',
 customerId:'customer_12345678',subscriptionId:'subscription_12345678',
 providerTransactionId:'provider_12345678',providerSubscriptionToken:'token_12345678',
 plan:'monthly',amountMinor:16500};
const preflight={ready:true,execute:false,grantEntitlement:false,
 requiresRollbackOnZeroChanges:true,verifiedPayment:payment,existingSubscription:null,
 plan:{requiresAtomicBatch:true,periodEnd:'2027-01-22T10:00:00.000Z',
 statements:[{name:'event'},{name:'order'},{name:'subscription'}]}};
const args={db,preflight,verifiedAt:'2026-12-22T10:00:00.000Z'};
assert.equal((await execute(args)).committed,false);
assert.equal(calls,0);
assert.equal((await execute({...args,preflight:{...preflight,verifiedPayment:{...payment,providerSubscriptionToken:null}},stagingOnly:true})).committed,false);
assert.equal(calls,0);
const good=await execute({...args,stagingOnly:true});
assert.equal(good.committed,true);
assert.equal(good.grantEntitlement,false);
fail=true;
const rolledBack=await execute({...args,stagingOnly:true});
assert.equal(rolledBack.committed,false);
assert.equal(rolledBack.grantEntitlement,false);
console.log('PASS: isolated initial recurring staging executor gating and rollback');

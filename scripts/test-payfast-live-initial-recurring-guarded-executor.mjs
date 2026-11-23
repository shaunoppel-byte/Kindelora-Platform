import assert from 'node:assert/strict';
import {executeGuardedInitialRecurringBatch as execute} from '../functions/_lib/payfast-live-initial-recurring-guarded-executor.js';
let calls=0,fail=false,partial=false;
const db={prepare(sql){return {bind(...args){return {sql,args};}}},async batch(statements){
 calls++;assert.equal(statements.length,5);
 if(fail)throw Error('D1 transaction rolled back');
 return statements.map((_,i)=>({success:true,meta:{changes:partial&&i===4?0:1}}));
}};
const payment={verified:true,environment:'live',paymentStatus:'COMPLETE',orderId:'order_12345678',
 customerId:'customer_12345678',subscriptionId:'subscription_12345678',
 providerTransactionId:'provider_12345678',providerSubscriptionToken:'token_12345678',
 plan:'monthly',amountMinor:16500};
const preflight={ready:true,execute:false,grantEntitlement:false,
 requiresRollbackOnZeroChanges:true,verifiedPayment:payment,existingSubscription:null,
 plan:{requiresAtomicBatch:true,periodEnd:'2027-01-22T10:00:00.000Z',
 statements:[{name:'event'},{name:'order'},{name:'subscription'}]}};
const args={db,preflight,verifiedAt:'2026-12-22T10:00:00.000Z'};
assert.equal((await execute({...args,preflight:{...preflight,ready:false}})).committed,false);
assert.equal((await execute({...args,preflight:{...preflight,verifiedPayment:{...payment,providerSubscriptionToken:null}}})).committed,false);
assert.equal((await execute({...args,preflight:{...preflight,existingSubscription:{id:'existing'}}})).committed,false);
assert.equal(calls,0,'invalid preflight must not write');
const good=await execute(args);
assert.equal(good.committed,true);
assert.equal(good.grantEntitlement,false);
assert.equal(calls,1);
fail=true;
assert.equal((await execute(args)).committed,false);
fail=false;partial=true;
assert.equal((await execute(args)).committed,false);
console.log('PASS: guarded live initial recurring-link executor validates preflight, commits five statements and denies failed batches');

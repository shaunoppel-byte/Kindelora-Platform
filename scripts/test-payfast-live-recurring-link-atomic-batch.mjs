import assert from 'node:assert/strict';
import {prepareAtomicInitialPaymentWithRecurringLink as prepare} from '../functions/_lib/payfast-live-recurring-link-atomic-batch.js';
const statements=[];
const db={prepare(sql){return {bind(...args){const statement={sql,args};statements.push(statement);return statement;}}}};
const p={verified:true,environment:'live',paymentStatus:'COMPLETE',orderId:'order_12345678',
 customerId:'customer_12345678',subscriptionId:'subscription_12345678',
 providerTransactionId:'provider_12345678',providerSubscriptionToken:'token_12345678',
 plan:'monthly',amountMinor:16500};
const preflight={ready:true,execute:false,grantEntitlement:false,
 requiresRollbackOnZeroChanges:true,verifiedPayment:p,existingSubscription:null,
 plan:{requiresAtomicBatch:true,periodEnd:'2027-01-22T10:00:00.000Z',
 statements:[{name:'event'},{name:'order'},{name:'subscription'}]}};
const date='2026-12-22T10:00:00.000Z';
assert.equal(prepare({db,preflight:{...preflight,verifiedPayment:{...p,providerSubscriptionToken:null}},verifiedAt:date}).ready,false);
assert.equal(prepare({db,preflight:{...preflight,existingSubscription:{id:p.subscriptionId}},verifiedAt:date}).ready,false);
assert.equal(prepare({db,preflight:{...preflight,ready:false},verifiedAt:date}).ready,false);
const result=prepare({db,preflight,verifiedAt:date});
assert.equal(result.ready,true);
assert.equal(result.execute,false);
assert.equal(result.grantEntitlement,false);
assert.equal(result.statements.length,0);
assert.equal(result.proposedStatements.length,5);
assert.deepEqual(result.proposedStatements.slice(0,3),preflight.plan.statements);
assert.match(result.proposedStatements[3].sql,/INSERT INTO plus_payfast_recurring_links/);
assert.match(result.proposedStatements[4].sql,/CASE WHEN changes\(\)=1/);
assert.match(result.proposedStatements[4].sql,/THEN \? ELSE NULL END/);
assert.equal(statements.length,2);
console.log('PASS: initial-payment plus recurring-link batch stays inert and rollback-guarded');

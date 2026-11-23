import assert from 'node:assert/strict';
import {livePlusActivationStatements} from '../functions/_lib/plus-live-activation-atomic-plan.js';

// Read-only SQL contract regression: this test does NOT authenticate, charge,
// mutate D1, or enable live checkout. It identifies a second renewal blocker.
const statements=[];
const db={prepare(sql){const statement={sql,args:null,bind(...args){this.args=args;return this}};statements.push(statement);return statement}};
const verifiedPayment={
  verified:true,environment:'live',paymentStatus:'COMPLETE',
  orderId:'kin_order_12345678',customerId:'kin_customer_12345678',
  providerTransactionId:'pf_renewal_12345678',
  subscriptionId:'sub_1234567890123456',plan:'monthly',amountMinor:16500
};
const existingSubscription={
  id:verifiedPayment.subscriptionId,customerId:verifiedPayment.customerId,
  status:'active',currentPeriodEnd:'2026-12-22T10:00:00.000Z'
};
const plan=livePlusActivationStatements({
  db,verifiedPayment,existingSubscription,paidAt:'2026-12-22T10:00:00.000Z'
});
assert.equal(plan?.requiresAtomicBatch,true);
assert.equal(plan.statements.length,3);
assert.equal(plan.periodEnd,'2027-01-22T10:00:00.000Z');
assert.match(statements[0].sql,/status='pending'/);
assert.match(statements[1].sql,/status='pending'/);
assert.match(statements[0].sql,/INSERT INTO plus_payment_events/);
assert.match(statements[1].sql,/UPDATE plus_orders/);
assert.match(statements[2].sql,/UPDATE plus_subscriptions/);
assert.equal(plan.grantEntitlement,false);
console.log('PASS: paid-order renewal is blocked by both event and order SQL predicates; plan remains inert');

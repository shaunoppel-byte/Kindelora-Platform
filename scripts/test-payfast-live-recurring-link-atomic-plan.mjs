import assert from 'node:assert/strict';
import {prepareAuthenticatedRecurringLinkStatement as compose} from '../functions/_lib/payfast-live-recurring-link-atomic-plan.js';
let calls=0,statement;
const db={prepare(sql){calls++;return {bind(...args){statement={sql,args};return statement;}}}};
const payment={verified:true,environment:'live',paymentStatus:'COMPLETE',
 orderId:'order_12345678',customerId:'customer_12345678',
 subscriptionId:'subscription_12345678',providerTransactionId:'provider_12345678',
 providerSubscriptionToken:'token_12345678',plan:'monthly',amountMinor:16500};
assert.equal(compose({db,verifiedPayment:{...payment,providerSubscriptionToken:null}}),null);
assert.equal(compose({db,verifiedPayment:{...payment,verified:false}}),null);
assert.equal(compose({db,verifiedPayment:{...payment,environment:'sandbox'}}),null);
assert.equal(calls,0);
assert.ok(compose({db,verifiedPayment:payment}));
assert.equal(calls,1);
assert.match(statement.sql,/INSERT INTO plus_payfast_recurring_links/);
assert.match(statement.sql,/JOIN plus_payment_events/);
assert.match(statement.sql,/NOT EXISTS/);
assert.deepEqual(statement.args,[payment.plan,payment.amountMinor,payment.providerSubscriptionToken,
 payment.orderId,payment.customerId,payment.amountMinor,payment.providerTransactionId,
 payment.subscriptionId,payment.providerTransactionId]);
console.log('PASS: recurring-link composer requires authenticated token and remains inert');

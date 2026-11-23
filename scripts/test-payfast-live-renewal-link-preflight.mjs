import assert from 'node:assert/strict';
import {verifyPersistedPayFastRenewalLink as verify} from '../functions/_lib/payfast-live-renewal-link-preflight.js';
const args={
 merchantReference:'kin_order_12345678',providerTransactionId:'pf_renewal_12345678',
 customerId:'kin_customer_12345678',subscriptionId:'sub_1234567890123456',
 plan:'monthly',paidZarMinor:16500,providerSubscriptionToken:'pf_token_12345678'
};
const authenticatedPayment={verified:true,environment:'live',paymentStatus:'COMPLETE',
 providerTransactionId:args.providerTransactionId,merchantReference:args.merchantReference,
 providerSubscriptionToken:args.providerSubscriptionToken,amountMinor:args.paidZarMinor};
const link={
 initial_order_id:args.merchantReference,subscription_id:args.subscriptionId,
 customer_id:args.customerId,plan_id:args.plan,expected_zar_minor:args.paidZarMinor,
 provider_subscription_token:args.providerSubscriptionToken
};
const order={id:args.merchantReference,status:'paid',customer_id:args.customerId,amount_minor:16500,currency:'ZAR'};
const subscription={id:args.subscriptionId,customer_id:args.customerId,status:'active',current_period_end:'2026-12-22T10:00:00.000Z'};
function fakeDb({linkRow=link,prior=null,initialEvent=null,orderRow=order,subscriptionRow=subscription}={}){
 return {prepare(sql){return {bind(){return {async first(){
  if(sql.includes('FROM plus_payfast_recurring_links'))return linkRow;
  if(sql.includes('FROM plus_payfast_renewal_events'))return prior;
  if(sql.includes('FROM plus_payment_events'))return initialEvent;
  if(sql.includes('FROM plus_orders'))return orderRow;
  if(sql.includes('FROM plus_subscriptions'))return subscriptionRow;
  throw Error('unexpected SQL');
 }}}}}};
}
const accepted=await verify({...args,authenticatedPayment,db:fakeDb()});
assert.equal(accepted.ready,true);
// A signed and provider-validated live ITN can now carry a verified token,
// but absent token/verified status must still fail closed. Never treat the
// authentication wrapper itself as the verified payment object.
const liveItnResult={authenticated:true,reason:'live_provider_confirmed',grantEntitlement:false,
 payment:{environment:'live',paymentStatus:'COMPLETE',merchantReference:args.merchantReference,
 providerTransactionId:args.providerTransactionId,amountMinor:args.paidZarMinor}};
assert.equal((await verify({...args,authenticatedPayment:liveItnResult.payment,db:fakeDb()})).ready,false,
 'live ITN result without verified recurring token cannot authorize renewal');
assert.equal((await verify({...args,authenticatedPayment:{...authenticatedPayment,providerSubscriptionToken:null},db:fakeDb()})).ready,false,
 'live ITN with missing recurring token cannot authorize renewal');
assert.equal((await verify({...args,authenticatedPayment:{...authenticatedPayment,providerSubscriptionToken:'other_token_12345678'},db:fakeDb()})).ready,false,
 'live ITN with different recurring token cannot authorize renewal');
assert.equal((await verify({...args,authenticatedPayment:{...authenticatedPayment,merchantReference:'different_order_12345678'},db:fakeDb()})).ready,false,
 'authenticated payment must be tied to original merchant reference');
assert.equal((await verify({...args,authenticatedPayment:{...authenticatedPayment,amountMinor:16501},db:fakeDb()})).ready,false,
 'authenticated amount must match renewal settlement amount');
assert.equal((await verify({...args,authenticatedPayment:liveItnResult,db:fakeDb()})).ready,false,
 'authenticated wrapper is not a verified recurring payment');
assert.equal((await verify({...args,db:fakeDb()})).ready,false,'missing provider authentication');
assert.equal((await verify({...args,authenticatedPayment:{...authenticatedPayment,environment:'sandbox'},db:fakeDb()})).ready,false,'sandbox envelope');
assert.equal((await verify({...args,authenticatedPayment:{...authenticatedPayment,verified:false},db:fakeDb()})).ready,false,'unverified envelope');
assert.equal((await verify({...args,authenticatedPayment:{...authenticatedPayment,providerTransactionId:'different_transaction_12345678'},db:fakeDb()})).ready,false,'mismatched provider transaction');
assert.equal(accepted.grantEntitlement,false);
assert.equal(accepted.execute,false);
assert.equal(accepted.renewal.previousPeriodEnd,subscription.current_period_end);
for(const [label,changes] of [
 ['wrong token',{providerSubscriptionToken:'wrong_token_12345678'}],
 ['wrong plan',{plan:'annual'}],
 ['wrong amount',{paidZarMinor:16499}],
 ['wrong customer',{customerId:'wrong_customer_12345678'}],
 ['wrong subscription',{subscriptionId:'wrong_subscription_12345678'}]
]){
 const result=await verify({...args,...changes,authenticatedPayment,db:fakeDb()});
 assert.equal(result.ready,false,label);
}
assert.equal((await verify({...args,authenticatedPayment,db:fakeDb({prior:{provider_transaction_id:args.providerTransactionId}})})).ready,false);
assert.equal((await verify({...args,authenticatedPayment,db:fakeDb({initialEvent:{id:'initial_event_12345678'}})})).ready,false);
assert.equal((await verify({...args,authenticatedPayment,db:fakeDb({orderRow:{...order,status:'pending'}})})).ready,false);
assert.equal((await verify({...args,authenticatedPayment,db:fakeDb({subscriptionRow:{...subscription,status:'cancelled'}})})).ready,false);
assert.equal((await verify({...args,authenticatedPayment,db:fakeDb({linkRow:{...link,provider_subscription_token:null}})})).ready,false);
assert.equal((await verify({...args,authenticatedPayment,db:{prepare(){throw Error('D1 down')}}})).ready,false);
console.log('PASS: recurring identity preflight accepts linked paid order and rejects mismatches/replays; no writes');

import assert from 'node:assert/strict';
import {verifyPersistedPayFastRenewalLink as verify} from '../functions/_lib/payfast-live-renewal-link-preflight.js';

// Strictly offline: model read-only D1 results; no PayFast calls or writes.
const input={merchantReference:'kin_order_12345678',providerTransactionId:'pf_renewal_12345678',
 customerId:'kin_customer_12345678',subscriptionId:'sub_1234567890123456',
 plan:'monthly',paidZarMinor:16500,providerSubscriptionToken:'pf_token_12345678'};
const link={initial_order_id:input.merchantReference,subscription_id:input.subscriptionId,
 customer_id:input.customerId,plan_id:input.plan,expected_zar_minor:16500,
 provider_subscription_token:input.providerSubscriptionToken};
const order={id:input.merchantReference,status:'paid',customer_id:input.customerId,amount_minor:16500,currency:'ZAR'};
const subscription={id:input.subscriptionId,customer_id:input.customerId,status:'active',
 current_period_end:'2026-12-22T10:00:00.000Z'};
const authenticated=value=>({verified:true,environment:'live',paymentStatus:'COMPLETE',
 providerTransactionId:value.providerTransactionId,merchantReference:value.merchantReference,
 providerSubscriptionToken:value.providerSubscriptionToken,amountMinor:value.paidZarMinor});
function readOnlyDb({linkRow=link,orderRow=order,subscriptionRow=subscription,prior=null}={}){
 const reads=[];
 return {reads,prepare(sql){
  assert.match(sql,/^SELECT\s/i,'preflight must only read');
  return {bind(...params){return {async first(){
   reads.push({sql,params});
   if(sql.includes('FROM plus_payfast_recurring_links'))return linkRow;
   if(sql.includes('FROM plus_payfast_renewal_events'))return prior;
   if(sql.includes('FROM plus_payment_events'))return null;
   if(sql.includes('FROM plus_orders'))return orderRow;
   if(sql.includes('FROM plus_subscriptions'))return subscriptionRow;
   throw Error('unknown query');
  }}}};
 }};
}
for(const [name,db,reason] of [
 ['missing link',readOnlyDb({linkRow:null}),'recurring_link_mismatch'],
 ['foreign link',readOnlyDb({linkRow:{...link,customer_id:'other_customer_123'}}),'recurring_link_mismatch'],
 ['wrong currency',readOnlyDb({orderRow:{...order,currency:'USD'}}),'original_order_mismatch'],
 ['unpaid original',readOnlyDb({orderRow:{...order,status:'pending'}}),'original_order_mismatch'],
 ['missing subscription',readOnlyDb({subscriptionRow:null}),'subscription_not_renewable'],
 ['invalid period',readOnlyDb({subscriptionRow:{...subscription,current_period_end:'invalid'}}),'subscription_not_renewable'],
 ['cancelled subscription',readOnlyDb({subscriptionRow:{...subscription,status:'cancelled'}}),'subscription_not_renewable'],
 ['replayed provider transaction',readOnlyDb({prior:{provider_transaction_id:input.providerTransactionId}}),'renewal_reference_already_recorded']
]){
 const outcome=await verify({...input,db,authenticatedPayment:authenticated(input)});
 assert.equal(outcome.ready,false,name);
 assert.equal(outcome.reason,reason,name);
 assert.equal(outcome.grantEntitlement,false,name);
 assert.ok(db.reads.length>0,name);
}
const unauthenticatedDb=readOnlyDb();
const unauthenticated=await verify({...input,db:unauthenticatedDb});
assert.equal(unauthenticated.reason,'provider_authentication_required');
assert.equal(unauthenticatedDb.reads.length,0,'unverified provider facts must not query D1');
for(const [name,changes] of [
 ['missing provider token',{providerSubscriptionToken:''}],
 ['fractional amount',{paidZarMinor:16500.1}],
 ['negative amount',{paidZarMinor:-1}],
 ['malformed reference',{merchantReference:'../../etc/passwd'}]
]){
 const db=readOnlyDb();
 const candidate={...input,...changes};
 const outcome=await verify({...candidate,db,authenticatedPayment:authenticated(candidate)});
 assert.equal(outcome.ready,false,name);
 assert.equal(outcome.reason,'invalid_renewal_identity',name);
 assert.equal(db.reads.length,0,name);
}
console.log('PASS: renewal preflight negative cases fail closed with read-only D1 simulation');

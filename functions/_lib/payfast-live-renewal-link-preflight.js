// Read-only, fail-closed recurring renewal identity preflight.
// Call ONLY after independent PayFast source, signature and provider validation.
// Does not execute D1 writes, grant PLUS, or change an order's paid status.
const deny=reason=>({ready:false,reason,grantEntitlement:false});
const validId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{8,128}$/.test(v);
export async function verifyPersistedPayFastRenewalLink({
 db,merchantReference,providerTransactionId,customerId,subscriptionId,
 plan,paidZarMinor,providerSubscriptionToken
}={}){
 if(!db||typeof db.prepare!=='function'||!validId(merchantReference)||
  !validId(providerTransactionId)||!validId(customerId)||!validId(subscriptionId)||
  !['monthly','annual'].includes(plan)||!Number.isSafeInteger(paidZarMinor)||
  paidZarMinor<500||!validId(providerSubscriptionToken))
  return deny('invalid_renewal_identity');
 try{
  const link=await db.prepare(
   'SELECT initial_order_id,subscription_id,customer_id,plan_id,expected_zar_minor,provider_subscription_token FROM plus_payfast_recurring_links WHERE initial_order_id=? LIMIT 1'
  ).bind(merchantReference).first();
  if(!link||link.initial_order_id!==merchantReference||
   link.subscription_id!==subscriptionId||link.customer_id!==customerId||
   link.plan_id!==plan||link.expected_zar_minor!==paidZarMinor||
   !link.provider_subscription_token||
   link.provider_subscription_token!==providerSubscriptionToken)
   return deny('recurring_link_mismatch');
  const prior=await db.prepare(
   'SELECT provider_transaction_id FROM plus_payfast_renewal_events WHERE provider_transaction_id=? LIMIT 1'
  ).bind(providerTransactionId).first();
  if(prior)return deny('renewal_reference_already_recorded');
  const original=await db.prepare(
   "SELECT id,status,customer_id,amount_minor,currency FROM plus_orders WHERE id=? AND brand='KIN' LIMIT 1"
  ).bind(merchantReference).first();
  if(!original||original.id!==merchantReference||original.status!=='paid'||
   original.customer_id!==customerId||original.amount_minor!==paidZarMinor||
   original.currency!=='ZAR')return deny('original_order_mismatch');
  const subscription=await db.prepare(
   "SELECT id,customer_id,status,current_period_end FROM plus_subscriptions WHERE id=? AND brand='KIN' LIMIT 1"
  ).bind(subscriptionId).first();
  if(!subscription||subscription.id!==subscriptionId||
   subscription.customer_id!==customerId||
   !['active','past_due'].includes(subscription.status)||
   typeof subscription.current_period_end!=='string'||
   !Number.isFinite(Date.parse(subscription.current_period_end)))
   return deny('subscription_not_renewable');
  return {ready:true,reason:'persisted_recurring_identity_matches',
   grantEntitlement:false,execute:false,
   renewal:Object.freeze({orderId:merchantReference,customerId,subscriptionId,
    providerTransactionId,plan,amountMinor:paidZarMinor,
    previousPeriodEnd:subscription.current_period_end})};
 }catch{return deny('renewal_database_unavailable')}
}

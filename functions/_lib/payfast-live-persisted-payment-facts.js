// Read-only production payment reconciliation preflight. Does not authenticate ITN
// or grant PLUS. Must run only after independent signature/source/provider checks.
const deny=reason=>({verified:false,reason,grantEntitlement:false});
export async function verifyPersistedLivePaymentFacts({db,merchantReference,merchantId,expectedMerchantId,paidZarMinor,providerTransactionId,paymentStatus,nowMs=Date.now()}={}){
 if(!db||typeof db.prepare!=='function'||!/^[A-Za-z0-9_-]{8,128}$/.test(merchantReference||'')||
  !/^[A-Za-z0-9_-]{8,128}$/.test(providerTransactionId||'')||
  typeof merchantId!=='string'||merchantId!==expectedMerchantId||!/^[0-9]{8,16}$/.test(merchantId)||
  !Number.isSafeInteger(paidZarMinor)||paidZarMinor<500||paymentStatus!=='COMPLETE'||
  !Number.isSafeInteger(nowMs)||nowMs<0)return deny('invalid_payment_facts');
 try{
  const order=await db.prepare("SELECT o.id,o.customer_id,o.amount_minor,o.currency,o.status,q.plan_id,q.display_usd_minor,q.settlement_zar_minor,q.expires_at FROM plus_orders o JOIN plus_order_quotes q ON q.order_id=o.id WHERE o.id=? AND o.brand='KIN' LIMIT 1")
   .bind(merchantReference).first();
  // A paid initial order is never eligible for initial-payment reconciliation.
  // Return an explicit routing signal so the caller can invoke the independently
  // authenticated recurring-link gate; never grant entitlement on this signal.
  if(order?.id===merchantReference&&order.status==='paid')return deny('renewal_requires_verified_recurring_link');
  if(!order||order.id!==merchantReference||order.status!=='pending'||order.currency!=='ZAR'||
   order.amount_minor!==paidZarMinor||order.settlement_zar_minor!==paidZarMinor||
   !['monthly','annual'].includes(order.plan_id)||
   order.display_usd_minor!==(order.plan_id==='monthly'?899:8999)||
   !/^[A-Za-z0-9_-]{8,128}$/.test(order.customer_id||'')||
   typeof order.expires_at!=='string'||!Number.isFinite(Date.parse(order.expires_at)))return deny('order_mismatch');
  // Expired checkout quotes cannot be used to create a NEW checkout, but a
  // provider-confirmed payment may arrive after expiry. Do not reject by ITN arrival time.
  const duplicate=await db.prepare('SELECT order_id FROM plus_payment_events WHERE provider_event_reference=? LIMIT 1')
   .bind(providerTransactionId).first();
  if(duplicate)return deny('provider_reference_already_recorded');
  return {verified:true,reason:'persisted_live_order_matches',grantEntitlement:false,
   order:Object.freeze({id:order.id,customerId:order.customer_id,plan:order.plan_id,amountMinor:order.amount_minor,providerTransactionId})};
 }catch{return deny('db_unavailable')}
}

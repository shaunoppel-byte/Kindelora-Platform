// Server-only subscription activation statement plan. Never call from browser input.
// This is NOT an authentication gate and does NOT execute D1 or grant access.
// A future live ITN handler must authenticate PayFast and commit ledger + entitlement
// in ONE atomic transaction, verifying each statement affected exactly one row.
import {calculatePlusEntitlementPeriod} from './plus-entitlement-period-policy.js';
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{8,128}$/.test(value);
export function livePlusActivationStatements({db,verifiedPayment,existingSubscription=null,paidAt}={}){
 if(!db||typeof db.prepare!=='function'||!verifiedPayment||
  verifiedPayment.verified!==true||verifiedPayment.environment!=='live'||
  verifiedPayment.paymentStatus!=='COMPLETE'||
  !validId(verifiedPayment.orderId)||!validId(verifiedPayment.customerId)||
  !validId(verifiedPayment.providerTransactionId)||
  !validId(verifiedPayment.subscriptionId)||
  !['monthly','annual'].includes(verifiedPayment.plan)||
  !Number.isSafeInteger(verifiedPayment.amountMinor)||verifiedPayment.amountMinor<500)return null;
 if(existingSubscription!==null&&(
  !validId(existingSubscription.id)||existingSubscription.customerId!==verifiedPayment.customerId||
  !['active','past_due','cancelled','expired'].includes(existingSubscription.status)))return null;
 const period=calculatePlusEntitlementPeriod({plan:verifiedPayment.plan,paidAt,
  previousPeriodEnd:existingSubscription?.currentPeriodEnd??null});
 if(!period.ok)return null;
 const {orderId,customerId,providerTransactionId,amountMinor,subscriptionId}=verifiedPayment;
 const paymentEventId='payfast_'+providerTransactionId;
 const statements=[
  db.prepare("INSERT INTO plus_payment_events(id,order_id,provider,provider_event_reference,event_type,verified_at) SELECT ?,id,'PayFast',?,'COMPLETE',? FROM plus_orders WHERE id=? AND customer_id=? AND brand='KIN' AND status='pending' AND currency='ZAR' AND amount_minor=?")
   .bind(paymentEventId,providerTransactionId,paidAt,orderId,customerId,amountMinor),
  db.prepare("UPDATE plus_orders SET status='paid',payment_reference=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND customer_id=? AND brand='KIN' AND status='pending' AND currency='ZAR' AND amount_minor=?")
   .bind(providerTransactionId,orderId,customerId,amountMinor)
 ];
 if(existingSubscription){
  statements.push(db.prepare("UPDATE plus_subscriptions SET status='active',current_period_end=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND customer_id=? AND brand='KIN' AND status=? AND current_period_end=?")
   .bind(period.periodEnd,existingSubscription.id,customerId,existingSubscription.status,existingSubscription.currentPeriodEnd));
 }else{
  statements.push(db.prepare("INSERT INTO plus_subscriptions(id,customer_id,brand,status,current_period_end) SELECT ?,id,'KIN','active',? FROM plus_customers WHERE id=?")
   .bind(subscriptionId,period.periodEnd,customerId));
 }
 return {statements,periodEnd:period.periodEnd,requiresAtomicBatch:true,grantEntitlement:false};
}
export function evaluateLivePlusActivationBatch(results){
 const committed=Array.isArray(results)&&results.length===3&&results.every(r=>r?.success===true&&r?.meta?.changes===1);
 return {committed,reason:committed?'atomic_payment_and_subscription_recorded':'commit_unconfirmed',
  // Only a higher-level handler may return entitlement after independently
  // authenticated provider confirmation AND a successful atomic D1 commit.
  grantEntitlement:false};
}

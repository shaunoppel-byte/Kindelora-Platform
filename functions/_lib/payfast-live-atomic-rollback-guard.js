// Append a constraint-enforced commit guard to the live activation batch.
// MUST execute all four statements together using Cloudflare D1 db.batch().
// The final INSERT fails NOT NULL if ANY expected payment/order/subscription
// condition is absent, causing D1's transactional batch to roll back.
// Never accept caller-supplied payment facts without independent PayFast auth.
const validId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{8,128}$/.test(v);
export function guardedLivePlusActivationBatch({db,plan,verifiedPayment,subscriptionId,verifiedAt}={}){
 if(!db||typeof db.prepare!=='function'||!plan||!Array.isArray(plan.statements)||plan.statements.length!==3||
  plan.requiresAtomicBatch!==true||!verifiedPayment||verifiedPayment.verified!==true||
  verifiedPayment.environment!=='live'||verifiedPayment.paymentStatus!=='COMPLETE'||
  !validId(verifiedPayment.orderId)||!validId(verifiedPayment.customerId)||
  !validId(verifiedPayment.providerTransactionId)||!validId(subscriptionId)||
  !Number.isSafeInteger(verifiedPayment.amountMinor)||verifiedPayment.amountMinor<500||
  typeof verifiedAt!=='string'||!Number.isFinite(Date.parse(verifiedAt))||
  typeof plan.periodEnd!=='string'||!Number.isFinite(Date.parse(plan.periodEnd)))return null;
 const {orderId,customerId,providerTransactionId,amountMinor}=verifiedPayment;
 // plus_payment_reconciliations.order_id is NOT NULL and UNIQUE.
 // If the condition fails, the CASE produces NULL, forcing a SQL constraint
 // failure inside db.batch() instead of a post-commit row-count warning.
 const guard=db.prepare(`INSERT INTO plus_payment_reconciliations
 (order_id,payment_reference,verified_at,verification_method,amount_minor,currency)
 VALUES (CASE WHEN changes()=1
 AND EXISTS (SELECT 1 FROM plus_orders WHERE id=? AND customer_id=? AND brand='KIN'
  AND status='paid' AND currency='ZAR' AND amount_minor=? AND payment_reference=?)
 AND EXISTS (SELECT 1 FROM plus_payment_events WHERE order_id=? AND provider='PayFast'
  AND provider_event_reference=? AND event_type='COMPLETE')
 AND EXISTS (SELECT 1 FROM plus_subscriptions WHERE id=? AND customer_id=? AND brand='KIN'
  AND status='active' AND current_period_end=?)
 THEN ? ELSE NULL END,? ,?,'payfast_itn_and_server_validation',?,'ZAR')`)
 .bind(orderId,customerId,amountMinor,providerTransactionId,orderId,providerTransactionId,
  subscriptionId,customerId,plan.periodEnd,orderId,providerTransactionId,verifiedAt,amountMinor);
 return {statements:[...plan.statements,guard],requiresAtomicBatch:true,grantEntitlement:false};
}
export function evaluateGuardedLivePlusBatch(results){
 const committed=Array.isArray(results)&&results.length===4&&results.every(r=>r?.success===true&&r?.meta?.changes===1);
 return {committed,reason:committed?'guarded_payment_subscription_reconciliation_committed':'commit_unconfirmed',grantEntitlement:false};
}

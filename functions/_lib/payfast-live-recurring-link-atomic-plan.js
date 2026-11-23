// Issue #806: inert, server-only recurring linkage statement composer.
// Must be appended to the independently authenticated initial-payment batch
// BEFORE its final transaction guard, never executed on its own.
// Does not charge PayFast, modify D1 or grant entitlement.
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{8,128}$/.test(value);
export function prepareAuthenticatedRecurringLinkStatement({db,verifiedPayment}={}){
 if(!db||typeof db.prepare!=='function'||!verifiedPayment||
  verifiedPayment.verified!==true||verifiedPayment.environment!=='live'||
  verifiedPayment.paymentStatus!=='COMPLETE'||
  !validId(verifiedPayment.orderId)||!validId(verifiedPayment.customerId)||
  !validId(verifiedPayment.subscriptionId)||
  !['monthly','annual'].includes(verifiedPayment.plan)||
  !Number.isSafeInteger(verifiedPayment.amountMinor)||verifiedPayment.amountMinor<500||
  !validId(verifiedPayment.providerSubscriptionToken))return null;
 const p=verifiedPayment;
 // The SELECT only succeeds when the initial order, event and active
 // subscription were atomically committed earlier in the SAME D1 batch.
 // Unique constraints reject replay or token reuse across subscriptions.
 return db.prepare(`INSERT INTO plus_payfast_recurring_links
 (initial_order_id,subscription_id,customer_id,plan_id,expected_zar_minor,provider_subscription_token)
 SELECT o.id,s.id,o.customer_id,?,?,?
 FROM plus_orders o JOIN plus_subscriptions s ON s.customer_id=o.customer_id
 JOIN plus_payment_events e ON e.order_id=o.id
 WHERE o.id=? AND o.customer_id=? AND o.brand='KIN' AND o.status='paid'
 AND o.currency='ZAR' AND o.amount_minor=? AND o.payment_reference=?
 AND s.id=? AND s.brand='KIN' AND s.status='active'
 AND e.provider='PayFast' AND e.provider_event_reference=?
 AND e.event_type='COMPLETE'
 AND NOT EXISTS (SELECT 1 FROM plus_payfast_recurring_links WHERE initial_order_id=o.id)`)
 .bind(p.plan,p.amountMinor,p.providerSubscriptionToken,p.orderId,p.customerId,
  p.amountMinor,p.providerTransactionId,p.subscriptionId,p.providerTransactionId);
}

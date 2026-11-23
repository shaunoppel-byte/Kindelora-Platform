// Inert D1 renewal transaction composer. This does not authenticate PayFast,
// execute SQL, charge anyone, or grant PLUS. Only feed it the result of the
// independent, provider-authenticated recurring-link preflight.
import {calculatePlusEntitlementPeriod} from './plus-entitlement-period-policy.js';
const validId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{8,128}$/.test(v);
export function prepareAtomicPayFastRenewal({db,verifiedRenewal,paidAt}={}){
 if(!db||typeof db.prepare!=='function'||!verifiedRenewal||
  verifiedRenewal.ready!==true||verifiedRenewal.execute!==false||
  verifiedRenewal.grantEntitlement!==false||!verifiedRenewal.renewal||
  typeof paidAt!=='string'||!Number.isFinite(Date.parse(paidAt)))return null;
 const r=verifiedRenewal.renewal;
 if(!validId(r.orderId)||!validId(r.customerId)||!validId(r.subscriptionId)||
  !validId(r.providerTransactionId)||!['monthly','annual'].includes(r.plan)||
  !Number.isSafeInteger(r.amountMinor)||r.amountMinor<500||
  typeof r.previousPeriodEnd!=='string'||!Number.isFinite(Date.parse(r.previousPeriodEnd)))
  return null;
 const period=calculatePlusEntitlementPeriod({
  plan:r.plan,paidAt,previousPeriodEnd:r.previousPeriodEnd
 });
 if(!period.ok||period.periodEnd<=r.previousPeriodEnd)return null;
 const statements=[
  db.prepare(`INSERT INTO plus_payfast_renewal_events
   (provider_transaction_id,initial_order_id,subscription_id,paid_zar_minor,
    status,previous_period_end,new_period_end,verified_at)
   SELECT ?,l.initial_order_id,l.subscription_id,?,'committed',?,?,?
   FROM plus_payfast_recurring_links l
   JOIN plus_orders o ON o.id=l.initial_order_id
   JOIN plus_subscriptions s ON s.id=l.subscription_id
   WHERE l.initial_order_id=? AND l.subscription_id=? AND l.customer_id=?
   AND l.plan_id=? AND l.expected_zar_minor=?
   AND l.provider_subscription_token IS NOT NULL
   AND o.status='paid' AND o.customer_id=l.customer_id
   AND o.amount_minor=? AND o.currency='ZAR'
   AND s.customer_id=l.customer_id AND s.status IN ('active','past_due')
   AND s.current_period_end=?
   AND NOT EXISTS (SELECT 1 FROM plus_payfast_renewal_events
                   WHERE provider_transaction_id=?)`)
   .bind(r.providerTransactionId,r.amountMinor,r.previousPeriodEnd,
    period.periodEnd,paidAt,r.orderId,r.subscriptionId,r.customerId,r.plan,
    r.amountMinor,r.amountMinor,r.previousPeriodEnd,r.providerTransactionId),
  db.prepare(`UPDATE plus_subscriptions
   SET status='active',current_period_end=?,updated_at=CURRENT_TIMESTAMP
   WHERE id=? AND customer_id=? AND brand='KIN'
   AND status IN ('active','past_due') AND current_period_end=?
   AND EXISTS (SELECT 1 FROM plus_payfast_renewal_events
     WHERE provider_transaction_id=? AND subscription_id=?
     AND previous_period_end=? AND new_period_end=? AND status='committed')`)
   .bind(period.periodEnd,r.subscriptionId,r.customerId,r.previousPeriodEnd,
    r.providerTransactionId,r.subscriptionId,r.previousPeriodEnd,period.periodEnd),
  // Force a transactional D1 batch rollback on a zero-row subscription update.
  // The guard's NOT NULL constraint must fail if changes() != 1.
  db.prepare(`INSERT INTO plus_payfast_renewal_events
   (provider_transaction_id,initial_order_id,subscription_id,paid_zar_minor,
    status,previous_period_end,new_period_end,verified_at)
   VALUES (CASE WHEN changes()=1 THEN ? ELSE NULL END,?,?,?,?,?,?,?)`)
   .bind(r.providerTransactionId,r.orderId,r.subscriptionId,r.amountMinor,
    'committed',r.previousPeriodEnd,period.periodEnd,paidAt)
 ];
 // IMPORTANT: third statement intentionally duplicates the unique provider
 // transaction ID and would ALWAYS fail, including successful renewals.
 // Do not execute this draft plan until a dedicated guard table or guard
 // strategy is implemented and tested against real D1.
 return {ready:false,reason:'requires_d1_atomic_guard_design',
  statements:[],proposedStatements:statements,periodEnd:period.periodEnd,
  execute:false,grantEntitlement:false};
}

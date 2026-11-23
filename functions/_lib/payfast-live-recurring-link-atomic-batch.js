// Issue #806: inert transaction composer for authenticated initial payment.
// Never execute outside an isolated staging proof until live provider E2E passes.
// All statements must be sent to ONE Cloudflare D1 db.batch transaction.
import {prepareAuthenticatedRecurringLinkStatement} from './payfast-live-recurring-link-atomic-plan.js';
const deny=reason=>({ready:false,reason,execute:false,grantEntitlement:false,statements:[]});
export function prepareAtomicInitialPaymentWithRecurringLink({db,preflight,verifiedAt}={}){
 if(!db||typeof db.prepare!=='function'||!preflight||
  preflight.ready!==true||preflight.execute!==false||
  preflight.grantEntitlement!==false||
  preflight.requiresRollbackOnZeroChanges!==true||
  !preflight.verifiedPayment||
  preflight.existingSubscription!=null||
  !preflight.plan||preflight.plan.requiresAtomicBatch!==true||
  !Array.isArray(preflight.plan.statements)||preflight.plan.statements.length!==3)
  return deny('authenticated_initial_payment_preflight_required');
 const p=preflight.verifiedPayment;
 if(typeof verifiedAt!=='string'||!Number.isFinite(Date.parse(verifiedAt)))
  return deny('verified_timestamp_required');
 const link=prepareAuthenticatedRecurringLinkStatement({db,verifiedPayment:p});
 if(!link)return deny('authenticated_recurring_token_required');
 const {orderId,customerId,providerTransactionId,amountMinor,subscriptionId}=p;
 // Changes() must equal one from the recurring-link insertion. The final
 // reconciliation row has NOT NULL order_id; a false condition forces a
 // constraint failure and rolls back the entire D1 batch, including link.
 const guard=db.prepare(`INSERT INTO plus_payment_reconciliations
 (order_id,payment_reference,verified_at,verification_method,amount_minor,currency)
 VALUES (CASE WHEN changes()=1
 AND EXISTS(SELECT 1 FROM plus_payfast_recurring_links l WHERE l.initial_order_id=?
  AND l.subscription_id=? AND l.customer_id=? AND l.plan_id=?
  AND l.expected_zar_minor=? AND l.provider_subscription_token=?)
 AND EXISTS(SELECT 1 FROM plus_orders o WHERE o.id=? AND o.customer_id=?
  AND o.status='paid' AND o.currency='ZAR' AND o.amount_minor=?
  AND o.payment_reference=?)
 AND EXISTS(SELECT 1 FROM plus_payment_events e WHERE e.order_id=?
  AND e.provider='PayFast' AND e.provider_event_reference=?
  AND e.event_type='COMPLETE')
 AND EXISTS(SELECT 1 FROM plus_subscriptions s WHERE s.id=?
  AND s.customer_id=? AND s.brand='KIN' AND s.status='active'
  AND s.current_period_end=?)
 THEN ? ELSE NULL END,?,?,'payfast_itn_and_server_validation',?,'ZAR')`)
 .bind(orderId,subscriptionId,customerId,p.plan,amountMinor,p.providerSubscriptionToken,
  orderId,customerId,amountMinor,providerTransactionId,
  orderId,providerTransactionId,subscriptionId,customerId,preflight.plan.periodEnd,
  orderId,providerTransactionId,verifiedAt,amountMinor);
 return {ready:true,reason:'authenticated_initial_recurring_batch_prepared',
  execute:false,grantEntitlement:false,requiresAtomicBatch:true,
  proposedStatements:[...preflight.plan.statements,link,guard],statements:[]};
}

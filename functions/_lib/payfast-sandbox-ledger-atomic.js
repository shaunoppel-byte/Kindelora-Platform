// Offline-only sandbox ledger transaction plan. Never use client-provided amounts.
// Caller MUST first authenticate ITN and obtain a trusted persisted order.
// DB.batch is atomic in D1; failures must not grant entitlement.
export function sandboxLedgerAtomicStatements({db,decision,order}={}){
 if(!db||typeof db.prepare!=='function'||!decision||decision.stage!=='pending_atomic_commit'||
  decision.accepted!==false||decision.grantEntitlement!==false||
  !order||order.environment!=='sandbox'||order.status!=='pending'||
  order.reference!==decision.merchantReference||order.zarMinor!==decision.paidMinor||
  order.plan!==decision.plan||typeof order.memberId!=='string'||!order.memberId||
  typeof decision.providerTransactionId!=='string')return null;
 return [
  db.prepare("INSERT INTO payfast_sandbox_transactions(provider_transaction_id,order_reference,paid_zar_minor,status) SELECT ?,?,?,'COMPLETE' WHERE EXISTS (SELECT 1 FROM payfast_sandbox_orders WHERE order_reference=? AND status='pending' AND zar_minor=? AND member_id=? AND plan=?)")
   .bind(decision.providerTransactionId,order.reference,order.zarMinor,order.reference,order.zarMinor,order.memberId,order.plan),
  db.prepare("UPDATE payfast_sandbox_orders SET status='paid',paid_at=CURRENT_TIMESTAMP WHERE order_reference=? AND status='pending' AND zar_minor=? AND member_id=? AND plan=?")
   .bind(order.reference,order.zarMinor,order.memberId,order.plan)
 ];
}
// IMPORTANT: this helper only constructs statements; it DOES NOT call DB.batch,
// persist payments, or activate entitlements. A future handler must verify
// both result meta.changes==1 and commit atomically before any entitlement.

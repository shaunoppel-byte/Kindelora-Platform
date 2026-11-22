// Production ledger SQL plan only. NEVER invoke with browser-supplied verification flags.
// A future server-only ITN pipeline must independently authenticate source, signature,
// provider response and persisted order, then execute this as a single D1 transaction.
// No subscription activation is included in this plan.
export function liveVerifiedPaymentLedgerStatements({db,payment,verifiedAt}={}){
 if(!db||typeof db.prepare!=='function'||!payment||payment.verified!==true||
  payment.environment!=='live'||payment.paymentStatus!=='COMPLETE'||
  !/^[A-Za-z0-9_-]{8,128}$/.test(payment.orderId||'')||
  !/^[A-Za-z0-9_-]{8,128}$/.test(payment.providerTransactionId||'')||
  !Number.isSafeInteger(payment.amountMinor)||payment.amountMinor<500||
  typeof verifiedAt!=='string'||!/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$/.test(verifiedAt)||
  !Number.isFinite(Date.parse(verifiedAt)))return null;
 const eventId='payfast_'+payment.providerTransactionId;
 return [
  db.prepare("INSERT INTO plus_payment_events(id,order_id,provider,provider_event_reference,event_type,verified_at) SELECT ?,id,'PayFast',?,'COMPLETE',? FROM plus_orders WHERE id=? AND brand='KIN' AND status='pending' AND currency='ZAR' AND amount_minor=?")
   .bind(eventId,payment.providerTransactionId,verifiedAt,payment.orderId,payment.amountMinor),
  db.prepare("UPDATE plus_orders SET status='paid',payment_reference=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND brand='KIN' AND status='pending' AND currency='ZAR' AND amount_minor=?")
   .bind(payment.providerTransactionId,payment.orderId,payment.amountMinor)
 ];
}
// The statement builder is intentionally inert. A transaction result must prove
// BOTH statements changed exactly one row; otherwise fail closed. This helper
// does not establish entitlement, nor does it prove PayFast authentication.
export function verifiedLiveLedgerCommitResult(results){
 const committed=Array.isArray(results)&&results.length===2&&results.every(r=>r?.success===true&&r?.meta?.changes===1);
 return {committed,grantEntitlement:false,reason:committed?'payment_ledger_recorded':'commit_unconfirmed'};
}

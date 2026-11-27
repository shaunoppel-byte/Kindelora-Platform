// Production D1 pending-order persistence foundation. No payment or entitlement activation.
// Requires preflight-validated server order; only a previously established PLUS customer
// mapped to the verified member may be used. Never trusts browser-provided customer IDs.
const deny=reason=>({persisted:false,reason,authorizesPayment:false});
export async function persistLivePendingOrder({db,order,verifiedMemberId,customerId,nowMs=Date.now()}={}){
 if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function'||!order||
  order.environment!=='live'||order.status!=='pending'||order.memberId!==verifiedMemberId||
  !/^[A-Za-z0-9_-]{8,128}$/.test(verifiedMemberId||'')||
  !/^[A-Za-z0-9_-]{8,128}$/.test(customerId||'')||
  !/^[A-Za-z0-9_-]{8,128}$/.test(order.reference||'')||
  !/^[A-Za-z0-9_-]{8,128}$/.test(order.fxReference||'')||
  !['monthly','annual'].includes(order.plan)||order.usdMinor!==(order.plan==='monthly'?899:8999)||
  !Number.isSafeInteger(order.zarMinor)||order.zarMinor<500||order.settlementCurrency!=='ZAR'||
  !Number.isSafeInteger(nowMs)||!Number.isSafeInteger(order.quoteExpiresAtMs)||order.quoteExpiresAtMs<=nowMs)
  return deny('invalid_order');
 try{
  // Confirm identity association before any writes. The caller cannot create or change
  // PLUS customer mappings here; registration and identity tables are untouched.
  const customer=await db.prepare('SELECT id,identity_subject FROM plus_customers WHERE id=? AND identity_subject=? LIMIT 1')
   .bind(customerId,verifiedMemberId).first();
  if(!customer||customer.id!==customerId||customer.identity_subject!==verifiedMemberId)return deny('customer_mismatch');
  const quotedAt=new Date(nowMs).toISOString(),expiresAt=new Date(order.quoteExpiresAtMs).toISOString();
  const result=await db.batch([
   db.prepare("INSERT INTO plus_orders(id,customer_id,brand,amount_minor,currency,status,payment_reference) SELECT ?,?,'KIN',?,'ZAR','pending',NULL WHERE NOT EXISTS (SELECT 1 FROM plus_orders o JOIN plus_order_quotes q ON q.order_id=o.id WHERE o.customer_id=? AND o.brand='KIN' AND o.status='pending' AND q.expires_at>?) AND NOT EXISTS (SELECT 1 FROM plus_subscriptions s WHERE s.customer_id=? AND s.brand='KIN' AND s.status IN ('active','cancelled') AND s.current_period_end>?)")
    .bind(order.reference,customerId,order.zarMinor,customerId,quotedAt,customerId,quotedAt),
   db.prepare('INSERT INTO plus_order_quotes(order_id,plan_id,display_usd_minor,settlement_zar_minor,fx_source,fx_rate_reference,quoted_at,expires_at,accepted_at) SELECT ?,?,?,?,?,?,?,?,? WHERE changes()=1 AND EXISTS (SELECT 1 FROM plus_orders WHERE id=?)')
    .bind(order.reference,order.plan,order.usdMinor,order.zarMinor,'server_verified',order.fxReference,quotedAt,expiresAt,quotedAt,order.reference)
  ]);
  if(Array.isArray(result)&&result.length===2&&result.every(r=>r?.success===true&&r?.meta?.changes===0))return deny('checkout_already_pending_or_active');
  if(!Array.isArray(result)||result.length!==2||result.some(r=>r?.success!==true||r?.meta?.changes!==1))return deny('commit_unconfirmed');
  return {persisted:true,reason:'pending_order_and_quote_recorded',authorizesPayment:false};
 }catch{return deny('db_failure')}
}

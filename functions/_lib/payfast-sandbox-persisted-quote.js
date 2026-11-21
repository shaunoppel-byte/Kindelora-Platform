// Server-side, read-only check of a previously persisted sandbox quote.
// Does not independently prove that the originating FX feed is trustworthy.
export async function verifyPersistedSandboxQuote({db,order,nowMs=Date.now()}={}){
 const deny=reason=>({verified:false,reason,grantEntitlement:false});
 if(!db||typeof db.prepare!=='function'||!order||order.environment!=='sandbox'||order.status!=='pending'||
 !Number.isSafeInteger(nowMs)||nowMs<0||!['monthly','annual'].includes(order.plan)||
 !/^[A-Za-z0-9_-]{8,128}$/.test(order.fxReference||'')||
 !/^[A-Za-z0-9_-]{8,128}$/.test(order.reference||'')||
 !Number.isSafeInteger(order.usdMinor)||!Number.isSafeInteger(order.zarMinor))return deny('invalid_request');
 try{
  const row=await db.prepare("SELECT quote_reference,order_reference,plan,usd_minor,zar_minor,settlement_currency,environment,source,expires_at_ms FROM payfast_sandbox_fx_quotes WHERE quote_reference=? AND order_reference=? LIMIT 1").bind(order.fxReference,order.reference).first();
  if(!row||row.quote_reference!==order.fxReference||row.order_reference!==order.reference||
  row.plan!==order.plan||row.usd_minor!==order.usdMinor||row.zar_minor!==order.zarMinor||
  row.settlement_currency!=='ZAR'||row.environment!=='sandbox'||row.source!=='server_verified'||
  !Number.isSafeInteger(row.expires_at_ms)||row.expires_at_ms<=nowMs)return deny('quote_mismatch_or_expired');
  return {verified:true,reason:'persisted_quote_matches',grantEntitlement:false};
 }catch{return deny('quote_unavailable')}
}

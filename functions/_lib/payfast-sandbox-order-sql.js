// Offline-only SQL plan for a trusted pending sandbox order.
// Does not execute SQL or start PayFast checkout. The caller must own DB transaction.
export function sandboxPendingOrderInsert({db,order}={}){
 if(!db||typeof db.prepare!=='function'||!order||order.environment!=='sandbox'||
  order.status!=='pending'||!/^[-A-Za-z0-9_]{8,128}$/.test(order.reference||'')||
  !/^[-A-Za-z0-9_]{8,128}$/.test(order.memberId||'')||
  !['monthly','annual'].includes(order.plan)||
  !Number.isSafeInteger(order.zarMinor)||order.zarMinor<=0||
  !Number.isSafeInteger(order.usdMinor)||order.usdMinor!==(order.plan==='monthly'?899:8999)||
  order.settlementCurrency!=='ZAR'||!/^[-A-Za-z0-9_]{8,128}$/.test(order.fxReference||'')||
  !Number.isSafeInteger(order.quoteExpiresAtMs)||order.quoteExpiresAtMs<=Date.now())return null;
 return db.prepare("INSERT INTO payfast_sandbox_orders(order_reference,member_id,plan,usd_minor,zar_minor,fx_reference,status) VALUES(?,?,?,?,?,?,'pending')")
  .bind(order.reference,order.memberId,order.plan,order.usdMinor,order.zarMinor,order.fxReference);
}

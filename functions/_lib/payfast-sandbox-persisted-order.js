// Sandbox-only trusted D1 order loader for independently verified PayFast ITNs.
// Never accepts an amount, member ID, or payment status from the browser.
export async function loadPendingSandboxOrder({db,reference}={}){
 if(!db||typeof db.prepare!=='function'||typeof reference!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(reference))
  return {ok:false,reason:'invalid_request'};
 try{
  const row=await db.prepare("SELECT order_reference,member_id,plan,usd_minor,zar_minor,fx_reference,status FROM payfast_sandbox_orders WHERE order_reference=? LIMIT 1").bind(reference).first();
  if(!row||row.status!=='pending'||row.order_reference!==reference||
    !/^[A-Za-z0-9_-]{8,128}$/.test(row.member_id||'')||
    !['monthly','annual'].includes(row.plan)||
    row.usd_minor!==(row.plan==='monthly'?899:8999)||
    !Number.isSafeInteger(row.zar_minor)||row.zar_minor<=0||
    !/^[A-Za-z0-9_-]{8,128}$/.test(row.fx_reference||''))
   return {ok:false,reason:'order_not_pending'};
  return {ok:true,order:Object.freeze({environment:'sandbox',status:'pending',reference:row.order_reference,
   memberId:row.member_id,plan:row.plan,usdMinor:row.usd_minor,zarMinor:row.zar_minor,
   settlementCurrency:'ZAR',fxReference:row.fx_reference}),authorizesPayment:false,grantEntitlement:false};
 }catch{return {ok:false,reason:'db_unavailable'}}
}

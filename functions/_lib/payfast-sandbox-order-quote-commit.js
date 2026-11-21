// Atomic D1 persistence of a trusted, server-constructed sandbox order and FX quote.
// Caller must independently authenticate member and obtain genuine FX quote.
// No public endpoint, checkout redirect, live charge or entitlement grant.
import {sandboxPendingOrderInsert} from './payfast-sandbox-order-sql.js';
export async function persistSandboxOrderAndQuote({db,order}={}){
 const deny=reason=>({persisted:false,reason,authorizesPayment:false});
 if(!db||typeof db.batch!=='function'||!order)return deny('invalid_request');
 const insert=sandboxPendingOrderInsert({db,order});
 if(!insert)return deny('invalid_order');
 if(!Number.isSafeInteger(order.quoteExpiresAtMs)||order.quoteExpiresAtMs<=Date.now())return deny('quote_expired');
 try{
  const quote=db.prepare("INSERT INTO payfast_sandbox_fx_quotes(quote_reference,order_reference,plan,usd_minor,zar_minor,settlement_currency,environment,source,expires_at_ms) VALUES(?,?,?,?,?,'ZAR','sandbox','server_verified',?)")
   .bind(order.fxReference,order.reference,order.plan,order.usdMinor,order.zarMinor,order.quoteExpiresAtMs);
  const result=await db.batch([insert,quote]);
  if(!Array.isArray(result)||result.length!==2||result.some(r=>r?.success!==true||r?.meta?.changes!==1))return deny('commit_unconfirmed');
  return {persisted:true,reason:'pending_order_and_quote_recorded',authorizesPayment:false};
 }catch{return deny('db_failure')}
}

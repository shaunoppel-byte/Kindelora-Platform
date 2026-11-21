// Read-only persisted sandbox replay state for server-verified ITNs.
// No public route, credentials, charges, payment acceptance or PLUS grant.
export async function loadSandboxReplayState({db,providerTransactionId,orderReference}={}){
 const valid=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{8,128}$/.test(s);
 if(!db||typeof db.prepare!=='function'||!valid(providerTransactionId)||!valid(orderReference))
  return {ok:false,reason:'invalid_request'};
 try{
  const transaction=await db.prepare("SELECT t.provider_transaction_id,t.order_reference,t.paid_zar_minor,t.status,o.plan FROM payfast_sandbox_transactions t JOIN payfast_sandbox_orders o ON o.order_reference=t.order_reference WHERE t.provider_transaction_id=? LIMIT 1").bind(providerTransactionId).first();
  const order=await db.prepare("SELECT provider_transaction_id,order_reference,paid_zar_minor,status FROM payfast_sandbox_transactions WHERE order_reference=? LIMIT 1").bind(orderReference).first();
  const safeTx=transaction?{
   providerTransactionId:transaction.provider_transaction_id,
   merchantReference:transaction.order_reference,
   paidMinor:transaction.paid_zar_minor,plan:transaction.plan,status:transaction.status
  }:null;
  const safeOrder=order?{
   providerTransactionId:order.provider_transaction_id,
   merchantReference:order.order_reference,
   paidMinor:order.paid_zar_minor,status:order.status
  }:null;
  return {ok:true,storedTransaction:safeTx,storedOrder:safeOrder,grantEntitlement:false};
 }catch{return {ok:false,reason:'db_unavailable'}}
}

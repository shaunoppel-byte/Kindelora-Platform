// REVIEW-ONLY helper for single-statement trigger-backed sandbox ledger.
// Requires deployment of schema/payfast_sandbox_atomic_trigger_draft.sql,
// reconciliation with existing draft schema and independent ITN authentication.
// This does not grant entitlement or expose an HTTP endpoint.
export async function commitSandboxAtomicInsert({db,decision,order}={}){
 const deny=reason=>({committed:false,grantEntitlement:false,reason});
 if(!db||typeof db.prepare!=='function'||!decision||
  decision.stage!=='pending_atomic_commit'||decision.accepted!==false||
  decision.grantEntitlement!==false||!order||
  order.environment!=='sandbox'||order.status!=='pending'||
  order.reference!==decision.merchantReference||
  order.zarMinor!==decision.paidMinor||order.plan!==decision.plan||
  typeof order.memberId!=='string'||!order.memberId||
  typeof decision.providerTransactionId!=='string'||
  !/^[A-Za-z0-9_-]{8,128}$/.test(decision.providerTransactionId))
  return deny('invalid_payment');
 try{
  const result=await db.prepare(
   "INSERT INTO payfast_atomic_transactions(provider_id,reference,zar_minor,status) VALUES(?,?,?,'COMPLETE')"
  ).bind(decision.providerTransactionId,order.reference,order.zarMinor).run();
  if(result?.meta?.changes!==1)return deny('commit_unconfirmed');
  return {committed:true,grantEntitlement:false,reason:'atomic_ledger_committed'};
 }catch{return deny('db_failure')}
}

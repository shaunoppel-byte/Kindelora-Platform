// Server-only verifier for the pseudonymous member row created in Sandbox D1.
// This is not an account-authentication or email-verification check.
// Sandbox ITNs may record a ledger event only; this never grants PLUS access.
export async function verifySandboxOrderMember({db,order}={}){
 const deny=reason=>({verified:false,reason,grantEntitlement:false});
 if(!db||typeof db.prepare!=='function'||!order||order.environment!=='sandbox'||
  order.status!=='pending'||typeof order.memberId!=='string'||
  !/^[A-Za-z0-9_-]{8,128}$/.test(order.memberId))return deny('invalid_request');
 try{
  // Checkout derives this opaque ID server-side and inserts a disabled shadow
  // record with this exact synthetic address. Never require the source account's
  // email verification or enabled status in the isolated sandbox ledger.
  const member=await db.prepare("SELECT id,email_normalized,disabled_at FROM members WHERE id=? LIMIT 1").bind(order.memberId).first();
  if(!member||member.id!==order.memberId||
   member.email_normalized!==order.memberId+'@sandbox.invalid'||
   member.disabled_at===null||member.disabled_at===undefined)
   return deny('sandbox_identity_unavailable');
  return {verified:true,reason:'sandbox_identity_verified',grantEntitlement:false};
 }catch{return deny('db_unavailable')}
}

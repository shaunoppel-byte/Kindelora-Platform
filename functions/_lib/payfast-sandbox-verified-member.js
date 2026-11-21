// Server-only membership check for a persisted sandbox order.
// An ITN never supplies a trusted member identity; derive it from the order.
export async function verifySandboxOrderMember({db,order}={}){
 const deny=reason=>({verified:false,reason,grantEntitlement:false});
 if(!db||typeof db.prepare!=='function'||!order||order.environment!=='sandbox'||
  order.status!=='pending'||typeof order.memberId!=='string'||
  !/^[A-Za-z0-9_-]{8,128}$/.test(order.memberId))return deny('invalid_request');
 try{
  const member=await db.prepare("SELECT id,email_verified_at,disabled_at FROM members WHERE id=? LIMIT 1").bind(order.memberId).first();
  if(!member||member.id!==order.memberId||!member.email_verified_at||member.disabled_at!==null&&member.disabled_at!==undefined)
   return deny('member_not_verified');
  return {verified:true,reason:'verified_member',grantEntitlement:false};
 }catch{return deny('db_unavailable')}
}

// Server-only PLUS customer identity association. Does not touch member registration.
// Caller MUST authenticate member session and pass the verified identity subject.
// No payment, subscription or entitlement is authorized by this helper.
const deny=reason=>({mapped:false,reason,authorizesPayment:false});
export async function ensurePlusCustomerForVerifiedMember({db,verifiedMemberId,customerId}={}){
 if(!db||typeof db.prepare!=='function'||
  !/^[A-Za-z0-9_-]{8,128}$/.test(verifiedMemberId||'')||
  !/^[A-Za-z0-9_-]{8,128}$/.test(customerId||''))return deny('invalid_identity');
 try{
  // Identity subject is UNIQUE: concurrent checkouts for one member cannot
  // create multiple customer mappings. A conflict never overwrites a mapping.
  await db.prepare('INSERT INTO plus_customers(id,identity_subject) VALUES(?,?) ON CONFLICT(identity_subject) DO NOTHING')
   .bind(customerId,verifiedMemberId).run();
  const existing=await db.prepare('SELECT id,identity_subject FROM plus_customers WHERE identity_subject=? LIMIT 1')
   .bind(verifiedMemberId).first();
  if(!existing||existing.identity_subject!==verifiedMemberId||
   !/^[A-Za-z0-9_-]{8,128}$/.test(existing.id||''))return deny('identity_mapping_unconfirmed');
  return {mapped:true,reason:'verified_member_customer_mapped',customerId:existing.id,authorizesPayment:false};
 }catch{return deny('db_failure')}
}

// Staging-only renewal transaction probe. Never import from a deployed Pages route.
// Requires independently authenticated recurring-link preflight and an isolated D1 DB.
// This function never charges PayFast or grants PLUS entitlement.
import {prepareAtomicPayFastRenewal} from './payfast-live-renewal-atomic-design.js';
const deny=reason=>({committed:false,reason,grantEntitlement:false});
export async function executeIsolatedPayFastRenewalStaging({db,verifiedRenewal,paidAt,stagingOnly=false}={}){
 if(stagingOnly!==true||!db||typeof db.batch!=='function'||typeof db.prepare!=='function')
  return deny('isolated_staging_required');
 const plan=prepareAtomicPayFastRenewal({db,verifiedRenewal,paidAt});
 if(!plan||plan.ready!==false||plan.execute!==false||plan.grantEntitlement!==false||
  !Array.isArray(plan.proposedStatements)||plan.proposedStatements.length!==6)
  return deny('verified_renewal_plan_required');
 try{
  const results=await db.batch(plan.proposedStatements);
  if(!Array.isArray(results)||results.length!==6||
   results.some((result,i)=>result?.success!==true||
    (i===0||i===3?result?.meta?.changes!==1:false)))
   return deny('transaction_unconfirmed');
  return {committed:true,reason:'isolated_staging_renewal_committed',periodEnd:plan.periodEnd,grantEntitlement:false};
 }catch{return deny('transaction_rolled_back_or_failed')}
}

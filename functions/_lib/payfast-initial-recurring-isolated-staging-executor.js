// Issue #806: isolated staging-only initial-payment + recurring-link transaction.
// Never import into production Pages routes. Does not call PayFast or grant PLUS.
// Requires a separately verified preflight and an isolated staging D1 binding.
import {prepareAtomicInitialPaymentWithRecurringLink} from './payfast-live-recurring-link-atomic-batch.js';
const deny=reason=>({committed:false,reason,grantEntitlement:false});
export async function executeIsolatedInitialRecurringStaging({db,preflight,verifiedAt,stagingOnly=false}={}){
 if(stagingOnly!==true||!db||typeof db.batch!=='function'||typeof db.prepare!=='function')
  return deny('isolated_staging_required');
 const plan=prepareAtomicInitialPaymentWithRecurringLink({db,preflight,verifiedAt});
 if(!plan?.ready||plan.execute!==false||plan.grantEntitlement!==false||
  plan.requiresAtomicBatch!==true||plan.statements?.length!==0||
  plan.proposedStatements?.length!==5)
  return deny('authenticated_initial_recurring_plan_required');
 try{
  const results=await db.batch(plan.proposedStatements);
  if(!Array.isArray(results)||results.length!==5||
   results.some(result=>result?.success!==true||result?.meta?.changes!==1))
   return deny('transaction_unconfirmed');
  return {committed:true,reason:'isolated_initial_recurring_committed',grantEntitlement:false};
 }catch{return deny('transaction_rolled_back_or_failed')}
}

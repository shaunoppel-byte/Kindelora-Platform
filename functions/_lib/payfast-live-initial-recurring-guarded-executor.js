// Server-only authenticated initial payment + recurring-link D1 transaction.
// Never call with browser input. All five SQL statements must commit atomically.
// Explicitly fail closed when no authenticated recurring token is available.
import {prepareAtomicInitialPaymentWithRecurringLink} from './payfast-live-recurring-link-atomic-batch.js';
const deny=reason=>({committed:false,reason,grantEntitlement:false});
export async function executeGuardedInitialRecurringBatch({db,preflight,verifiedAt}={}){
 if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')
  return deny('database_unavailable');
 const plan=prepareAtomicInitialPaymentWithRecurringLink({db,preflight,verifiedAt});
 if(plan?.ready!==true||plan.execute!==false||plan.grantEntitlement!==false||
  plan.requiresAtomicBatch!==true||plan.statements?.length!==0||
  plan.proposedStatements?.length!==5)return deny('authenticated_recurring_plan_required');
 try{
  const results=await db.batch(plan.proposedStatements);
  if(!Array.isArray(results)||results.length!==5||
   results.some(r=>r?.success!==true||r?.meta?.changes!==1))
   return deny('transaction_not_committed');
  return {committed:true,reason:'authenticated_initial_recurring_recorded',grantEntitlement:false};
 }catch{return deny('transaction_failed')}
}

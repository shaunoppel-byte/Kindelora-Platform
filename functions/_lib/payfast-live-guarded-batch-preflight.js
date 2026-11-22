// Bind the rollback guard to the actual subscription being modified.
// Renewals MUST use the persisted subscription ID, not a newly generated ID.
// This is an inert plan composer; it never executes D1 or grants PLUS access.
import {guardedLivePlusActivationBatch} from './payfast-live-atomic-rollback-guard.js';
const deny=reason=>({ready:false,reason,grantEntitlement:false});
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{8,128}$/.test(value);
export function prepareGuardedLivePlusBatch({db,preflight,verifiedAt}={}){
 if(!db||typeof db.prepare!=='function'||!preflight||preflight.ready!==true||
  preflight.execute!==false||preflight.requiresRollbackOnZeroChanges!==true||
  preflight.grantEntitlement!==false||!preflight.verifiedPayment||
  !preflight.plan||!Array.isArray(preflight.plan.statements)||
  preflight.plan.statements.length!==3)return deny('invalid_preflight');
 const id=preflight.verifiedPayment.subscriptionId;
 if(!validId(id))return deny('invalid_subscription_id');
 // The original activation preflight uses the caller-generated subscriptionId.
 // For a renewal, that ID MUST match the existing subscription row.
 const existing=preflight.existingSubscription;
 if(existing!==undefined&&existing!==null&&existing.id!==id)return deny('subscription_id_mismatch');
 const guarded=guardedLivePlusActivationBatch({db,plan:preflight.plan,
  verifiedPayment:preflight.verifiedPayment,subscriptionId:id,verifiedAt});
 if(!guarded||guarded.statements.length!==4)return deny('guard_unavailable');
 return {ready:true,reason:'guarded_plan_prepared',grantEntitlement:false,
  execute:false,requiresAtomicBatch:true,statements:guarded.statements};
}

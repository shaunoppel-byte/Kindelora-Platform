// Inert live ITN-to-PLUS activation preflight. Never writes D1 or grants access.
// Production execution must use a transaction that ROLLS BACK on any conditional
// statement changing zero rows; D1 batch row-count checks AFTER commit are not
// sufficient to guarantee all-or-nothing semantics.
import {reconcileAuthenticatedLivePayFastItn} from './payfast-live-authenticated-reconciliation.js';
import {loadLivePlusSubscriptionState} from './plus-live-subscription-state.js';
import {livePlusActivationStatements} from './plus-live-activation-atomic-plan.js';
const deny=reason=>({ready:false,reason,grantEntitlement:false});
export async function prepareAuthenticatedLivePlusActivation({db,request,raw,merchantId,passphrase,allowedCidrs,fetchImpl,nowMs=Date.now(),subscriptionId}={}){
 if(!db||typeof db.prepare!=='function'||typeof subscriptionId!=='string'||
  !/^[A-Za-z0-9_-]{8,128}$/.test(subscriptionId)||!Number.isSafeInteger(nowMs)||nowMs<0)
  return deny('invalid_preflight');
 const reconciliation=await reconcileAuthenticatedLivePayFastItn({db,request,raw,merchantId,passphrase,allowedCidrs,fetchImpl,nowMs});
 if(!reconciliation.ready)return deny('payment_not_authenticated_or_reconciled');
 const state=await loadLivePlusSubscriptionState({db,verifiedPayment:reconciliation.payment});
 if(!state.ready)return deny('subscription_state_unavailable');
 const verifiedPayment={...reconciliation.payment,subscriptionId};
 const plan=livePlusActivationStatements({db,verifiedPayment,existingSubscription:state.existingSubscription,paidAt:new Date(nowMs).toISOString()});
 if(!plan||!plan.requiresAtomicBatch||plan.statements?.length!==3)return deny('activation_plan_unavailable');
 return {ready:true,reason:'authenticated_payment_and_subscription_plan_prepared',
  grantEntitlement:false,execute:false,requiresRollbackOnZeroChanges:true,
  plan,verifiedPayment};
}

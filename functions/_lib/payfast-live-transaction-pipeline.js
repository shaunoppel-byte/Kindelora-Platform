// Internal-only live PayFast ITN transaction pipeline. No public route.
// Only server-owned merchant secrets and Cloudflare request headers are valid.
// Does not return or directly grant PLUS access. Keep launch NO-GO until real
// Cloudflare D1, provider, entitlement and recurring-payment E2E pass.
import {prepareAuthenticatedLivePlusActivation} from './payfast-live-plus-activation-preflight.js';
import {executeGuardedLivePlusBatch} from './payfast-live-guarded-d1-executor.js';
import {executeGuardedInitialRecurringBatch} from './payfast-live-initial-recurring-guarded-executor.js';
const deny=reason=>({committed:false,reason,grantEntitlement:false});
export async function processAuthenticatedLivePlusPayment({db,request,raw,merchantId,passphrase,allowedCidrs,fetchImpl,nowMs=Date.now(),subscriptionId,requireRecurringLink=false}={}){
 if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function'||
  !request||typeof request.headers?.get!=='function'||
  !Number.isSafeInteger(nowMs)||nowMs<0||typeof subscriptionId!=='string'||
  !/^[A-Za-z0-9_-]{8,128}$/.test(subscriptionId))return deny('invalid_pipeline_configuration');
 try{
  const preflight=await prepareAuthenticatedLivePlusActivation({db,request,raw,merchantId,passphrase,allowedCidrs,fetchImpl,nowMs,subscriptionId});
  if(!preflight.ready)return deny('authenticated_preflight_failed');
  // Opt-in is controlled exclusively by server configuration, never by the ITN body.
  // For recurring subscriptions, reject missing authenticated tokens rather than
  // recording a paid order with no usable renewal linkage.
  const result=requireRecurringLink===true
   ? await executeGuardedInitialRecurringBatch({db,preflight,verifiedAt:new Date(nowMs).toISOString()})
   : await executeGuardedLivePlusBatch({db,preflight,verifiedAt:new Date(nowMs).toISOString()});
  if(!result.committed)return deny('transaction_not_committed');
  return {committed:true,reason:'authenticated_live_payment_transaction_committed',grantEntitlement:false};
 }catch{return deny('pipeline_failed')}
}

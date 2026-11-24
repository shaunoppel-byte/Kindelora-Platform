// Separate live PayFast ITN callback. Explicitly OFF until production D1,
// subscription lifecycle, secrets and live E2E readiness are approved.
// Never changes the existing sandbox callback or registration workflow.
import {verifyLivePlusD1Schema} from '../../_lib/payfast-live-d1-schema-preflight.js';
import {processAuthenticatedLivePlusPayment} from '../../_lib/payfast-live-transaction-pipeline.js';
import {processAuthenticatedLivePayFastRenewal} from '../../_lib/payfast-live-renewal-transaction-pipeline.js';
const reply=(status,reason)=>new Response(JSON.stringify({accepted:status===200,reason,grantEntitlement:false}),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function onRequestPost({request,env}={}){
 if(!request||!env||env.PAYFAST_LIVE_ITN_ENABLED!=='true')return reply(503,'live_itn_disabled');
 if(!env.DB||typeof env.DB.prepare!=='function'||typeof env.DB.batch!=='function'||
  !/^[0-9]{8,16}$/.test(env.PAYFAST_LIVE_MERCHANT_ID||'')||
  typeof env.PAYFAST_LIVE_PASSPHRASE!=='string'||!env.PAYFAST_LIVE_PASSPHRASE||
  typeof env.PAYFAST_LIVE_ALLOWED_CIDRS!=='string'||!env.PAYFAST_LIVE_ALLOWED_CIDRS.trim())return reply(503,'live_itn_unconfigured');
 const type=request.headers.get('content-type')||'';
 if(!/^application\/x-www-form-urlencoded(?:\s*;|\s*$)/i.test(type))return reply(415,'unsupported_content_type');
 const length=Number(request.headers.get('content-length')||'0');
 if(!Number.isSafeInteger(length)||length>16384)return reply(413,'body_too_large');
 let raw;try{raw=await request.text()}catch{return reply(400,'invalid_body')}
 if(!raw||new TextEncoder().encode(raw).byteLength>16384)return reply(400,'invalid_body');
 // A fresh server-generated ID; renewals use the existing persisted ID.
 const schema=await verifyLivePlusD1Schema({db:env.DB,requireRecurring:env.PAYFAST_LIVE_RENEWAL_ITN_ENABLED==='true'||env.PAYFAST_LIVE_INITIAL_RECURRING_LINK_ENABLED==='true'});
 if(!schema.ready)return reply(503,'live_d1_schema_unavailable');
 // Renewal path is explicitly server-gated. The renewal pipeline independently
 // authenticates the ITN and verifies the persisted recurring link; no browser
 // or raw ITN field can select a customer, plan or subscription identity.
 // A paid original order is required to select renewal, never a pending order.
 let renewal=false;
 if(env.PAYFAST_LIVE_RENEWAL_ITN_ENABLED==='true'){
  try{
   const reference=new URLSearchParams(raw).get('m_payment_id');
   if(reference&&/^[A-Za-z0-9_-]{8,128}$/.test(reference)){
    const order=await env.DB.prepare("SELECT status FROM plus_orders WHERE id=? AND brand='KIN' LIMIT 1").bind(reference).first();
    renewal=order?.status==='paid';
   }
  }catch{return reply(503,'renewal_identity_lookup_unavailable')}
 }
 if(renewal){
  const result=await processAuthenticatedLivePayFastRenewal({db:env.DB,request,raw,
   merchantId:env.PAYFAST_LIVE_MERCHANT_ID,passphrase:env.PAYFAST_LIVE_PASSPHRASE,
   allowedCidrs:env.PAYFAST_LIVE_ALLOWED_CIDRS});
  if(result.committed===true)return reply(200,result.duplicate===true?
   'verified_renewal_duplicate_acknowledged':'verified_renewal_recorded');
  if(['renewal_transaction_failed','transaction_not_committed','renewal_atomic_plan_unavailable'].includes(result.reason))
   return reply(503,'renewal_recording_unavailable');
  return reply(403,'renewal_notification_rejected');
 }
 const subscriptionId='sub_'+crypto.randomUUID().replaceAll('-','');
 const result=await processAuthenticatedLivePlusPayment({db:env.DB,request,raw,
  merchantId:env.PAYFAST_LIVE_MERCHANT_ID,passphrase:env.PAYFAST_LIVE_PASSPHRASE,
  allowedCidrs:env.PAYFAST_LIVE_ALLOWED_CIDRS,subscriptionId,
  requireRecurringLink:env.PAYFAST_LIVE_INITIAL_RECURRING_LINK_ENABLED==='true'});
 if(result.committed===true)return reply(200,'verified_payment_recorded');
 // A transient database/transaction failure is not an invalid PayFast notice.
 // Return 503 so the provider can retry instead of treating the notice as rejected.
 if(['transaction_failed','transaction_not_committed','pipeline_failed'].includes(result.reason))
  return reply(503,'payment_recording_unavailable');
 return reply(403,'notification_rejected');
}
export async function onRequestGet(){return reply(405,'method_not_allowed')}

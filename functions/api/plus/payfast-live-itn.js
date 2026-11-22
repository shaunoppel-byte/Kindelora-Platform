// Separate live PayFast ITN callback. Explicitly OFF until production D1,
// subscription lifecycle, secrets and live E2E readiness are approved.
// Never changes the existing sandbox callback or registration workflow.
import {verifyLivePlusD1Schema} from '../../_lib/payfast-live-d1-schema-preflight.js';
import {processAuthenticatedLivePlusPayment} from '../../_lib/payfast-live-transaction-pipeline.js';
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
 const schema=await verifyLivePlusD1Schema({db:env.DB});
 if(!schema.ready)return reply(503,'live_d1_schema_unavailable');
 const subscriptionId='sub_'+crypto.randomUUID().replaceAll('-','');
 const result=await processAuthenticatedLivePlusPayment({db:env.DB,request,raw,
  merchantId:env.PAYFAST_LIVE_MERCHANT_ID,passphrase:env.PAYFAST_LIVE_PASSPHRASE,
  allowedCidrs:env.PAYFAST_LIVE_ALLOWED_CIDRS,subscriptionId});
 return result.committed===true?reply(200,'verified_payment_recorded'):reply(403,'notification_rejected');
}
export async function onRequestGet(){return reply(405,'method_not_allowed')}

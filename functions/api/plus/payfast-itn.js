// Sandbox-only PayFast ITN receiver. OFF unless explicitly enabled.
// Never handles live payments and never grants PLUS access.
import {processProviderConfirmedSandboxItn} from '../../_lib/payfast-provider-confirmed-sandbox-pipeline.js';
const reply=(status,reason)=>new Response(JSON.stringify({accepted:status===200,reason,grantEntitlement:false}),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function onRequestPost({request,env}={}){
 if(!request||!env||env.PAYFAST_SANDBOX_ITN_ENABLED!=='true')return reply(503,'sandbox_disabled');
 const db=env.PAYFAST_SANDBOX_DB;
 if(env.PAYFAST_SANDBOX_ISOLATED_DB_ENABLED!=='true'||!db||db===env.DB)return reply(503,'sandbox_database_unavailable');
 if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function'||
 !/^[0-9]{8,16}$/.test(env.PAYFAST_SANDBOX_MERCHANT_ID||'')||
 typeof env.PAYFAST_SANDBOX_PASSPHRASE!=='string'||!env.PAYFAST_SANDBOX_PASSPHRASE||
 typeof env.PAYFAST_SANDBOX_ALLOWED_CIDRS!=='string'||!env.PAYFAST_SANDBOX_ALLOWED_CIDRS)return reply(503,'sandbox_unconfigured');
 const type=request.headers.get('content-type')||'';
 if(!/^application\/x-www-form-urlencoded(?:\s*;|\s*$)/i.test(type))return reply(415,'unsupported_content_type');
 const length=Number(request.headers.get('content-length')||'0');
 if(!Number.isSafeInteger(length)||length>16384)return reply(413,'body_too_large');
 let raw;
 try{raw=await request.text()}catch{return reply(400,'invalid_body')}
 if(!raw||new TextEncoder().encode(raw).byteLength>16384)return reply(400,'invalid_body');
 const result=await processProviderConfirmedSandboxItn({db,raw,contentType:type,request,
  expectedMerchantId:env.PAYFAST_SANDBOX_MERCHANT_ID,passphrase:env.PAYFAST_SANDBOX_PASSPHRASE,
  allowedCidrs:env.PAYFAST_SANDBOX_ALLOWED_CIDRS});
 if(result.committed!==true){
  // Keep the public response generic, but retain the safe failure code in
  // Cloudflare invocation logs so Sandbox ITN failures can be diagnosed.
  // Never log raw ITN values, provider tokens, signatures, or customer data.
  console.warn('[payfast-sandbox-itn] notification rejected', {reason:result.reason||'unknown'});
 }
 return result.committed===true?reply(200,'sandbox_ledger_committed'):reply(403,'notification_rejected');
}
export async function onRequestGet(){return reply(405,'method_not_allowed')}

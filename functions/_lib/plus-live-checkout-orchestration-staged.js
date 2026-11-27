// STAGED ONLY: not a deployed Pages route. Production checkout remains disabled until all release safety checks pass.
import {reply,ready,member,originOK,random} from '../api/member/_auth.js';
import {issueTrustedSandboxFxQuote} from './payfast-sandbox-trusted-fx.js';
import {prepareLiveOrderFacts} from './payfast-live-order-preflight.js';
import {ensurePlusCustomerForVerifiedMember} from './plus-verified-member-customer.js';
import {persistLivePendingOrder} from './payfast-live-order-persistence.js';
import {buildPayFastLiveRedirect} from './payfast-live-redirect.js';
import {verifyLivePlusD1Schema} from './payfast-live-d1-schema-preflight.js';
import {verifyPlusEntitlement} from './plus-entitlement.js';
const deny=(status,reason)=>reply({ok:false,reason,checkoutReady:false},status);
export async function onRequestPost({request,env}={}){
 if(!request||!ready(env)||env.PAYFAST_LIVE_CHECKOUT_ENABLED!=='true'||
  env.PAYFAST_LIVE_ITN_ENABLED!=='true'||env.PAYFAST_LIVE_RECURRING_VERIFIED!=='true'||
  env.PAYFAST_LIVE_INITIAL_RECURRING_LINK_ENABLED!=='true'||env.PAYFAST_LIVE_RENEWAL_ITN_ENABLED!=='true')return deny(503,'live_checkout_disabled');
 if(!originOK(request))return deny(403,'invalid_origin');
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return deny(415,'json_required');
 if(Number(request.headers.get('content-length')||0)>1024)return deny(413,'body_too_large');
 if(new URL(request.url).origin!=='https://kindelora.pages.dev')return deny(403,'invalid_host');
 let user;try{user=await member(request,env)}catch{return deny(503,'authentication_unavailable')}
 if(!user)return deny(401,'authentication_required');
 const entitlement=await verifyPlusEntitlement({db:env.DB,verifiedIdentitySubject:user.id});
 if(entitlement.reason==='unavailable')return deny(503,'membership_verification_unavailable');
 if(entitlement.entitled)return deny(409,'membership_already_active');
 let data;try{const raw=await request.text();if(new TextEncoder().encode(raw).byteLength>1024)return deny(413,'body_too_large');data=JSON.parse(raw)}catch{return deny(400,'invalid_request')}
 if(!data||typeof data!=='object'||Array.isArray(data)||!['monthly','annual'].includes(data.plan)||
  Object.keys(data).length!==1)return deny(400,'invalid_plan');
 if(!/^[0-9]{8,16}$/.test(env.PAYFAST_LIVE_MERCHANT_ID||'')||
  typeof env.PAYFAST_LIVE_MERCHANT_KEY!=='string'||env.PAYFAST_LIVE_MERCHANT_KEY.length<8||
  typeof env.PAYFAST_LIVE_PASSPHRASE!=='string'||!env.PAYFAST_LIVE_PASSPHRASE||
  typeof env.PAYFAST_LIVE_ALLOWED_CIDRS!=='string'||!env.PAYFAST_LIVE_ALLOWED_CIDRS.trim())return deny(503,'merchant_unavailable');
 const schema=await verifyLivePlusD1Schema({db:env.DB,requireRecurring:true});
 if(!schema.ready)return deny(503,'live_schema_unavailable');
 const nowMs=Date.now(),reference='kin_'+random(),fxReference='fx_'+random();
 // Reuse the strict trusted HTTPS FX provider adapter; convert only its
 // validated sandbox marker to the live quote contract, never browser-supplied FX.
 const fx=await issueTrustedSandboxFxQuote({plan:data.plan,nowMs,reference:fxReference,fxEndpoint:env.PAYFAST_LIVE_FX_ENDPOINT ?? 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=ZAR'});
 if(!fx.ok)return deny(503,'trusted_fx_unavailable');
 const quote={...fx.quote,environment:'live'};
 const prepared=prepareLiveOrderFacts({plan:data.plan,verifiedMemberId:user.id,reference,quote,nowMs});
 if(!prepared.ok)return deny(503,'order_preflight_failed');
 const origin=new URL(request.url).origin;
 const redirect=buildPayFastLiveRedirect({order:prepared.order,merchantId:env.PAYFAST_LIVE_MERCHANT_ID,
  merchantKey:env.PAYFAST_LIVE_MERCHANT_KEY,passphrase:env.PAYFAST_LIVE_PASSPHRASE,
  returnUrl:origin+'/plus-account.html?payment=live-return',
  cancelUrl:origin+'/plus-account.html?payment=live-cancel',
  notifyUrl:origin+'/api/plus/payfast-live-itn',recurringApproved:env.PAYFAST_LIVE_RECURRING_VERIFIED==='true',nowMs});
 if(!redirect.ok)return deny(503,'redirect_unavailable');
 const mapping=await ensurePlusCustomerForVerifiedMember({db:env.DB,verifiedMemberId:user.id,customerId:'cus_'+random()});
 if(!mapping.mapped)return deny(503,'customer_mapping_unavailable');
 const stored=await persistLivePendingOrder({db:env.DB,order:prepared.order,verifiedMemberId:user.id,
  customerId:mapping.customerId,nowMs});
 if(!stored.persisted)return deny(503,'order_persistence_failed');
 return reply({ok:true,environment:'live',reference,redirect:{action:redirect.action,method:redirect.method,fields:redirect.fields},checkoutReady:true});
}
export async function onRequestGet(){return deny(405,'method_not_allowed')}

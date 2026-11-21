// Sandbox-only authenticated checkout. Production checkout remains disabled.
// Member identity and USD prices are server-derived; no client payment amounts.
import {reply,ready,member,originOK,random} from '../member/_auth.js';
import {issueTrustedSandboxFxQuote} from '../../_lib/payfast-sandbox-trusted-fx.js';
import {prepareSandboxCheckout} from '../../_lib/payfast-sandbox-checkout-orchestration.js';
const deny=(status,reason)=>reply({ok:false,reason,checkoutReady:false},status);
export async function onRequestPost({request,env}={}){
 if(!request||!ready(env)||env.PAYFAST_SANDBOX_CHECKOUT_ENABLED!=='true')return deny(503,'sandbox_checkout_disabled');
 if(!originOK(request))return deny(403,'invalid_origin');
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return deny(415,'json_required');
 if(Number(request.headers.get('content-length')||0)>1024)return deny(413,'body_too_large');
 let user;try{user=await member(request,env)}catch{return deny(503,'authentication_unavailable')}
 if(!user)return deny(401,'authentication_required');
 let data;try{data=await request.json()}catch{return deny(400,'invalid_request')}
 if(!data||!['monthly','annual'].includes(data.plan)||Object.keys(data).some(k=>k!=='plan'))return deny(400,'invalid_plan');
 const origin=new URL(request.url).origin;
 if(origin!=='https://kindelora.pages.dev')return deny(403,'invalid_host');
 const merchant={merchantId:env.PAYFAST_SANDBOX_MERCHANT_ID,merchantKey:env.PAYFAST_SANDBOX_MERCHANT_KEY,
 passphrase:env.PAYFAST_SANDBOX_PASSPHRASE,
 returnUrl:origin+'/plus-account.html?payment=sandbox-return',
 cancelUrl:origin+'/plus-account.html?payment=sandbox-cancel',
 notifyUrl:origin+'/api/plus/payfast-itn'};
 const nowMs=Date.now(),reference='kin_'+random(),fxReference='fx_'+random();
 const fx=await issueTrustedSandboxFxQuote({plan:data.plan,nowMs,reference:fxReference,fxEndpoint:env.PAYFAST_SANDBOX_FX_ENDPOINT});
 if(!fx.ok)return deny(503,'trusted_fx_unavailable');
 const result=await prepareSandboxCheckout({db:env.DB,plan:data.plan,verifiedMemberId:user.id,reference,quote:fx.quote,nowMs,merchant});
 if(!result.ok)return deny(503,'sandbox_checkout_unavailable');
 return reply({ok:true,environment:'sandbox',reference,redirect:result.redirect,checkoutReady:false});
}
export async function onRequestGet(){return deny(405,'method_not_allowed')}

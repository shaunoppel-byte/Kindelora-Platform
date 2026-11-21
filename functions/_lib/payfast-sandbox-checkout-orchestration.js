// Server-only sandbox checkout orchestration. Caller MUST independently
// authenticate the member and obtain a trusted FX quote. No public route.
import {buildSandboxPendingOrder} from './payfast-sandbox-order-builder.js';
import {persistSandboxOrderAndQuote} from './payfast-sandbox-order-quote-commit.js';
import {buildPayFastSandboxRedirect} from './payfast-sandbox-redirect.js';
const deny=reason=>({ok:false,reason,authorizesPayment:false});
export async function prepareSandboxCheckout({db,plan,verifiedMemberId,reference,quote,nowMs,merchant}={}){
 if(!merchant||typeof merchant!=='object')return deny('merchant_unavailable');
 const built=buildSandboxPendingOrder({plan,memberId:verifiedMemberId,reference,quote,nowMs});
 if(!built.ok)return deny('order_invalid');
 // Validate redirect BEFORE writing any pending order to D1.
 const redirect=buildPayFastSandboxRedirect({order:built.order,...merchant});
 if(!redirect.ok)return deny('redirect_unavailable');
 const stored=await persistSandboxOrderAndQuote({db,order:built.order});
 if(!stored.persisted)return deny('persistence_failed');
 return {ok:true,environment:'sandbox',redirect:{action:redirect.action,method:redirect.method,fields:redirect.fields},authorizesPayment:false};
}

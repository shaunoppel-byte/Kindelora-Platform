// Server-only PayFast sandbox redirect contract. Never accepts browser-supplied price.
// Must only be called AFTER authenticated order+quote are persisted and merchant
// settings verified. No public route or live payment activation.
import {signPayfastForm} from './payfast-form-signature.mjs';
const validUrl=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&u.hostname==='kindelora.pages.dev'}catch{return false}};
const deny=reason=>({ok:false,reason,authorizesPayment:false});
export function buildPayFastSandboxRedirect({order,merchantId,merchantKey,passphrase,returnUrl,cancelUrl,notifyUrl}={}){
 if(!order||order.environment!=='sandbox'||order.status!=='pending'||!['monthly','annual'].includes(order.plan)||
 order.usdMinor!==(order.plan==='monthly'?899:8999)||!Number.isSafeInteger(order.zarMinor)||order.zarMinor<=0||
 order.settlementCurrency!=='ZAR'||!/^[A-Za-z0-9_-]{8,128}$/.test(order.reference||'')||
 !Number.isSafeInteger(order.quoteExpiresAtMs)||order.quoteExpiresAtMs<=Date.now())return deny('invalid_order');
 if(!/^[0-9]{8,16}$/.test(merchantId||'')||typeof merchantKey!=='string'||merchantKey.length<8||merchantKey.length>128||
 typeof passphrase!=='string'||passphrase.length<1||passphrase.length>256)return deny('merchant_configuration_unavailable');
 if(![returnUrl,cancelUrl,notifyUrl].every(validUrl))return deny('invalid_callback_url');
 const fields={merchant_id:merchantId,merchant_key:merchantKey,return_url:returnUrl,cancel_url:cancelUrl,notify_url:notifyUrl,
 m_payment_id:order.reference,amount:(order.zarMinor/100).toFixed(2),item_name:order.plan==='monthly'?'KINDELORA Plus Monthly':'KINDELORA Plus Annual',
 // PayFast recurring billing requires explicit subscription metadata; without
 // these fields checkout is a once-off payment, not a subscription.
 subscription_type:'1',recurring_amount:(order.zarMinor/100).toFixed(2),
 frequency:order.plan==='monthly'?'3':'6',cycles:'0'};
 return {ok:true,environment:'sandbox',action:'https://sandbox.payfast.co.za/eng/process',
  method:'POST',fields:{...fields,signature:signPayfastForm(fields,passphrase)},authorizesPayment:false};
}

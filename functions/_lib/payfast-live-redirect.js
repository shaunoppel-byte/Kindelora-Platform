// Production PayFast redirect builder. Server-only; NEVER a public payment endpoint.
// Caller must authenticate the member, persist a verified live order and FX quote,
// and confirm merchant recurring billing before using the resulting form.
import {md5} from './payfast-md5.js';
const deny=reason=>({ok:false,reason,authorizesPayment:false});
const encode=v=>encodeURIComponent(v).replace(/%20/g,'+').replace(/[!'()*~]/g,ch=>'%'+ch.charCodeAt(0).toString(16).toUpperCase());
const callback=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&u.hostname==='kindelora.pages.dev'}catch{return false}};
export function buildPayFastLiveRedirect({order,merchantId,merchantKey,passphrase,returnUrl,cancelUrl,notifyUrl,nowMs=Date.now()}={}){
 if(!order||order.environment!=='live'||order.status!=='pending'||!['monthly','annual'].includes(order.plan)||
  order.usdMinor!==(order.plan==='monthly'?899:8999)||!Number.isSafeInteger(order.zarMinor)||order.zarMinor<500||
  order.settlementCurrency!=='ZAR'||!/^[A-Za-z0-9_-]{8,128}$/.test(order.reference||'')||
  !Number.isSafeInteger(nowMs)||!Number.isSafeInteger(order.quoteExpiresAtMs)||order.quoteExpiresAtMs<=nowMs)return deny('invalid_order');
 if(!/^[0-9]{8,16}$/.test(merchantId||'')||typeof merchantKey!=='string'||merchantKey.length<8||merchantKey.length>128||
  typeof passphrase!=='string'||!passphrase||passphrase.length>256)return deny('merchant_configuration_unavailable');
 if(![returnUrl,cancelUrl,notifyUrl].every(callback))return deny('invalid_callback_url');
 // Live payment notifications must never be routed to the sandbox receiver,
 // generic PLUS endpoints, or a URL with a query string.
 const notify=new URL(notifyUrl);
 if(notify.pathname!=='/api/plus/payfast-live-itn'||notify.search)return deny('invalid_live_notify_url');
 const fields={merchant_id:merchantId,merchant_key:merchantKey,return_url:returnUrl,cancel_url:cancelUrl,notify_url:notifyUrl,
  m_payment_id:order.reference,amount:(order.zarMinor/100).toFixed(2),item_name:order.plan==='monthly'?'KINDELORA Plus Monthly':'KINDELORA Plus Annual',
  subscription_type:'1',frequency:order.plan==='monthly'?'3':'6',cycles:'0',recurring_amount:(order.zarMinor/100).toFixed(2)};
 const pairs=Object.entries(fields).map(([k,v])=>k+'='+encode(v));
 pairs.push('passphrase='+encode(passphrase));
 return {ok:true,environment:'live',action:'https://www.payfast.co.za/eng/process',method:'POST',fields:{...fields,signature:md5(pairs.join('&'))},authorizesPayment:false};
}

// Construct a PayFast hosted-checkout request from an already persisted order.
// NEVER accept order, amount, merchant credentials or URLs from browser input.
// A verified order/quote must be loaded server-side before calling this helper.
import {signPayfastForm} from './payfast-form-signature.mjs';
import {selectPlusPlan} from './plus-pricing.mjs';
const url=(s)=>{const u=new URL(s);if(u.protocol!=='https:'||u.username||u.password||u.hash)throw new TypeError('invalid_return_url');return u.href;};
const money=n=>(n/100).toFixed(2);
export function buildPayfastHostedCheckout(order,config){
 if(!order||!config||typeof order.id!=='string'||!/^[-_a-zA-Z0-9]{8,64}$/.test(order.id)||
   order.status!=='pending'||order.currency!=='ZAR'||!Number.isSafeInteger(order.amountMinor)||
   order.amountMinor<500||order.amountMinor!==order.acceptedQuoteZarMinor||
   !Number.isFinite(Date.parse(order.quoteExpiresAt))||Date.parse(order.quoteExpiresAt)<=Date.now())
   throw new TypeError('invalid_or_expired_order');
 const plan=selectPlusPlan(order.planId);
 if(order.displayUsdMinor!==plan.usdMinor)throw new TypeError('plan_price_mismatch');
 if(!config.merchantId||!config.merchantKey||!config.passphrase)throw new TypeError('merchant_configuration_missing');
 const base=url(config.baseUrl);
 const returnUrl=url(config.returnUrl),cancelUrl=url(config.cancelUrl),notifyUrl=url(config.notifyUrl);
 const fields={
  merchant_id:config.merchantId,merchant_key:config.merchantKey,
  return_url:returnUrl,cancel_url:cancelUrl,notify_url:notifyUrl,
  m_payment_id:order.id,amount:money(order.amountMinor),
  item_name:order.planId==='annual'?'KINDELORA Plus Annual':'KINDELORA Plus Monthly',
  subscription_type:'1',recurring_amount:money(order.amountMinor),
  frequency:String(plan.payfastFrequency),cycles:'0'
 };
 return Object.freeze({action:base,method:'POST',fields:Object.freeze({...fields,signature:signPayfastForm(fields,config.passphrase)})});
}

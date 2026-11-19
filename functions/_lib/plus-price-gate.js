// KINDELORA founder-approved DISPLAY prices. Not authorization to charge in USD.
// Never convert currencies implicitly, trust a client amount, or enable PayFast
// recurring charges without provider-verified billing currency and approved amount.
export const PLANS=Object.freeze({
 monthly:Object.freeze({id:'monthly',displayCurrency:'USD',displayAmountMinor:899,period:'monthly'}),
 annual:Object.freeze({id:'annual',displayCurrency:'USD',displayAmountMinor:8999,period:'annual'})
});
export function resolvePayfastCharge({planId,env}={}){
 if(typeof planId!=='string'||!Object.hasOwn(PLANS,planId))return {ready:false,reason:'invalid_plan'};
 if(!env||env.PAYFAST_CHECKOUT_ENABLED!=='true'||env.PAYFAST_RECURRING_VERIFIED!=='true')return {ready:false,reason:'release_disabled'};
 if(env.PAYFAST_BILLING_CURRENCY!=='ZAR'&&env.PAYFAST_BILLING_CURRENCY!=='USD')return {ready:false,reason:'billing_currency_unverified'};
 // No exchange rate or price can be inferred from the founder-approved USD display.
 // Only explicitly approved provider-currency price amounts can be charged.
 const amountKey=planId==='monthly'?'PAYFAST_MONTHLY_AMOUNT_MINOR':'PAYFAST_ANNUAL_AMOUNT_MINOR';
 const value=env[amountKey];
 if(typeof value!=='string'||!/^[1-9][0-9]{0,9}$/.test(value))return {ready:false,reason:'provider_currency_price_unapproved'};
 if(env.PAYFAST_PRICE_APPROVED!=='true')return {ready:false,reason:'price_not_approved'};
 return {ready:true,planId,currency:env.PAYFAST_BILLING_CURRENCY,amountMinor:Number(value)};
}

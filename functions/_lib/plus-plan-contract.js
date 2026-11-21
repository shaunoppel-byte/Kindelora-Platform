// Canonical PLUS pricing contract. This module NEVER initiates a payment.
// Amounts and plan durations must originate on the server, not from browser input.
const PLANS=Object.freeze({
 monthly:Object.freeze({plan:'monthly',usdMinor:899,periodMonths:1}),
 annual:Object.freeze({plan:'annual',usdMinor:8999,periodMonths:12})
});
export function resolvePlusPlan(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,reason:'invalid_request'};
 const keys=Object.keys(input);
 if(keys.length!==1||keys[0]!=='plan'||typeof input.plan!=='string')return {ok:false,reason:'unexpected_fields'};
 const plan=Object.hasOwn(PLANS,input.plan)?PLANS[input.plan]:null;
 if(!plan)return {ok:false,reason:'invalid_plan'};
 return {ok:true,plan:plan.plan,usdMinor:plan.usdMinor,currency:'USD',periodMonths:plan.periodMonths,authorizesPayment:false};
}
export function approvedPlusPlans(){
 return {monthly:{currency:'USD',amountMinor:PLANS.monthly.usdMinor},annual:{currency:'USD',amountMinor:PLANS.annual.usdMinor}};
}

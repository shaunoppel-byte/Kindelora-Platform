// Offline-only quote contract. This function cannot initiate a charge.
// Server must independently verify and persist a trusted FX/settlement quote
// before any sandbox checkout is constructed. No client-provided amount accepted.
export const PLANS=Object.freeze({
 monthly:Object.freeze({usdMinor:899,interval:'monthly'}),
 annual:Object.freeze({usdMinor:8999,interval:'annual'})
});
export function validateSandboxQuote(quote,plan,nowMs){
 const approved=PLANS[plan];
 if(!approved)return {ok:false,reason:'unknown_plan'};
 if(!quote||typeof quote!=='object')return {ok:false,reason:'missing_quote'};
 if(quote.source!=='server_verified'||quote.environment!=='sandbox')return {ok:false,reason:'untrusted_quote'};
 if(quote.plan!==plan||quote.usdMinor!==approved.usdMinor)return {ok:false,reason:'plan_mismatch'};
 if(quote.settlementCurrency!=='ZAR'||!Number.isSafeInteger(quote.zarMinor)||quote.zarMinor<=0)return {ok:false,reason:'invalid_settlement'};
 if(typeof quote.fxReference!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(quote.fxReference))return {ok:false,reason:'invalid_fx_reference'};
 if(!Number.isSafeInteger(nowMs)||!Number.isSafeInteger(quote.expiresAtMs)||!Number.isSafeInteger(quote.issuedAtMs)||quote.issuedAtMs>nowMs||quote.expiresAtMs<=nowMs||quote.expiresAtMs-quote.issuedAtMs>15*60*1000)return {ok:false,reason:'expired_or_invalid_quote'};
 return {ok:true,plan,usdMinor:approved.usdMinor,zarMinor:quote.zarMinor,fxReference:quote.fxReference,environment:'sandbox',authorizesPayment:false};
}

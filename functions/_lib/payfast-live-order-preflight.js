// Pure server-side preflight for a production PLUS order. Does not charge or grant access.
// Caller MUST authenticate member, obtain trusted FX quote, persist the order atomically,
// and independently verify recurring merchant capability before creating a redirect.
import {resolvePlusPlan} from './plus-plan-contract.js';
const deny=reason=>({ok:false,reason,authorizesPayment:false});
export function prepareLiveOrderFacts({plan,verifiedMemberId,reference,quote,nowMs}={}){
 const approved=resolvePlusPlan({plan});
 if(!approved.ok)return deny('invalid_plan');
 if(typeof verifiedMemberId!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(verifiedMemberId))return deny('invalid_member');
 if(typeof reference!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(reference))return deny('invalid_reference');
 if(!Number.isSafeInteger(nowMs)||nowMs<0)return deny('invalid_clock');
 if(!quote||quote.environment!=='live'||quote.source!=='server_verified'||quote.plan!==plan||
  quote.usdMinor!==approved.usdMinor||quote.settlementCurrency!=='ZAR'||
  !Number.isSafeInteger(quote.zarMinor)||quote.zarMinor<500||
  !Number.isSafeInteger(quote.issuedAtMs)||!Number.isSafeInteger(quote.expiresAtMs)||
  quote.issuedAtMs>nowMs||quote.expiresAtMs<=nowMs||quote.expiresAtMs-quote.issuedAtMs>600000||
  !/^[A-Za-z0-9_-]{8,128}$/.test(quote.fxReference||''))return deny('invalid_trusted_quote');
 return {ok:true,authorizesPayment:false,order:Object.freeze({environment:'live',status:'pending',plan,
  memberId:verifiedMemberId,reference,usdMinor:approved.usdMinor,zarMinor:quote.zarMinor,
  settlementCurrency:'ZAR',fxReference:quote.fxReference,quoteExpiresAtMs:quote.expiresAtMs})};
}

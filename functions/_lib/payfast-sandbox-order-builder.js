// Offline-only trusted sandbox order builder. No database writes, credentials or charges.
// The caller MUST independently authenticate the member and obtain a trusted quote.
import {resolvePlusPlan} from './plus-plan-contract.js';
import {validateSandboxQuote} from './payfast-sandbox-quote.js';
const DENY=Object.freeze({ok:false,authorizesPayment:false});
export function buildSandboxPendingOrder({plan,memberId,reference,quote,nowMs}={}){
 if(typeof memberId!=='string'||!/^[-A-Za-z0-9_]{8,128}$/.test(memberId))return DENY;
 if(typeof reference!=='string'||!/^[-A-Za-z0-9_]{8,128}$/.test(reference))return DENY;
 if(!Number.isSafeInteger(nowMs)||nowMs<0)return DENY;
 const approved=resolvePlusPlan({plan});
 if(!approved.ok)return DENY;
 const trusted=validateSandboxQuote(quote,plan,nowMs);
 if(!trusted.ok)return DENY;
 return {ok:true,authorizesPayment:false,order:Object.freeze({
  environment:'sandbox',status:'pending',reference,memberId,plan,
  usdMinor:approved.usdMinor,zarMinor:trusted.zarMinor,
  settlementCurrency:'ZAR',fxReference:trusted.fxReference,
  quoteExpiresAtMs:quote.expiresAtMs
 })};
}

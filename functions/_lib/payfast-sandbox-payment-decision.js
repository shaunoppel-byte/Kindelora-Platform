// Pure fail-closed payment decision gate. No PayFast requests, charges or DB writes.
// Call only AFTER independent cryptographic signature, merchant, server-to-server
// validation and trusted persisted quote checks. Caller owns transactional idempotency.
const DENY=Object.freeze({accepted:false,grantEntitlement:false});
export function evaluateSandboxPayment(input){
 if(!input||typeof input!=='object')return DENY;
 const {environment,signatureVerified,merchantVerified,serverVerified,quoteVerified,
  transactionStatus,providerTransactionId,merchantReference,expectedMerchantReference,
  paidCurrency,paidMinor,expectedZarMinor,alreadyProcessed,memberVerified,plan}=input;
 if(environment!=='sandbox'||signatureVerified!==true||merchantVerified!==true||
  serverVerified!==true||quoteVerified!==true||memberVerified!==true)return DENY;
 if(transactionStatus!=='COMPLETE'||alreadyProcessed!==false)return DENY;
 if(typeof providerTransactionId!=='string'||! /^[A-Za-z0-9_-]{1,128}$/.test(providerTransactionId))return DENY;
 if(typeof merchantReference!=='string'||! /^[A-Za-z0-9_-]{8,128}$/.test(merchantReference)||
  merchantReference!==expectedMerchantReference)return DENY;
 if(paidCurrency!=='ZAR'||!Number.isSafeInteger(paidMinor)||paidMinor<=0||
  !Number.isSafeInteger(expectedZarMinor)||paidMinor!==expectedZarMinor)return DENY;
 if(plan!=='monthly'&&plan!=='annual')return DENY;
 return {accepted:true,grantEntitlement:true,providerTransactionId,merchantReference,plan,
  paidCurrency:'ZAR',paidMinor,environment:'sandbox'};
}

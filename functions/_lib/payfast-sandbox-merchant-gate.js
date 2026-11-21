// Pure merchant/order gate for already parsed sandbox ITN envelopes.
// This is NOT signature verification, IP verification, provider confirmation,
// payment acceptance or entitlement granting. No environment or DB access.
export function validateSandboxItnMerchant({envelope,expectedMerchantId,expectedOrder}={}){
 if(!envelope||envelope.ok!==true||envelope.authenticated!==false||
  envelope.grantEntitlement!==false)return {ok:false,reason:'untrusted_envelope'};
 if(typeof expectedMerchantId!=='string'||!/^[0-9]{4,32}$/.test(expectedMerchantId)||
  envelope.merchantId!==expectedMerchantId)return {ok:false,reason:'merchant_mismatch'};
 if(!expectedOrder||typeof expectedOrder!=='object'||expectedOrder.environment!=='sandbox'||
  typeof expectedOrder.reference!=='string'||envelope.merchantReference!==expectedOrder.reference||
  !/^[A-Za-z0-9_-]{8,128}$/.test(expectedOrder.reference))return {ok:false,reason:'order_mismatch'};
 if(!Number.isSafeInteger(expectedOrder.zarMinor)||expectedOrder.zarMinor<=0||
  envelope.amountZarMinor!==expectedOrder.zarMinor)return {ok:false,reason:'amount_mismatch'};
 if(envelope.paymentStatus!=='COMPLETE')return {ok:false,reason:'not_complete'};
 return {ok:true,merchantVerified:true,orderVerified:true,amountVerified:true,
  authenticated:false,grantEntitlement:false};
}

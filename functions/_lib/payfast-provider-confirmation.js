// Pure, offline-only PayFast server-confirmation response validator.
// A caller must make the HTTPS request to PayFast's documented validation endpoint.
// Never accept this result from the client; signature, source, order facts, and
// durable idempotency are separate mandatory gates before any PLUS entitlement.
export function parsePayfastValidationResponse(status,body){
 if(status!==200)return {ok:false,reason:'provider_http_failure'};
 if(typeof body!=='string'||body.length>256)return {ok:false,reason:'invalid_provider_response'};
 const normalized=body.trim();
 if(normalized==='VALID')return {ok:true,reason:'provider_confirmed'};
 if(normalized==='INVALID')return {ok:false,reason:'provider_rejected'};
 return {ok:false,reason:'unexpected_provider_response'};
}
export function paymentAuthorizationGates({signatureValid=false,sourceTrusted=false,providerConfirmed=false,orderFactsValid=false,idempotentlyPersisted=false}={}){
 const missing=[];
 if(signatureValid!==true)missing.push('signature');
 if(sourceTrusted!==true)missing.push('source');
 if(providerConfirmed!==true)missing.push('provider_confirmation');
 if(orderFactsValid!==true)missing.push('order_facts');
 if(idempotentlyPersisted!==true)missing.push('durable_idempotency');
 return {authorized:missing.length===0,missing};
}

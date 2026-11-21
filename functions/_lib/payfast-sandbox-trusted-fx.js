// Sandbox-only server-issued FX quote. No client exchange rate or payment amounts.
// Requires a trusted HTTPS rate service explicitly configured by the operator.
// Source service must return JSON {base:"USD",quote:"ZAR",rate:number,asOf:"YYYY-MM-DD"}.
const deny=reason=>({ok:false,reason,authorizesPayment:false});
export async function issueTrustedSandboxFxQuote({plan,nowMs,fxEndpoint,fetchImpl=fetch,reference}={}){
 const usdMinor=plan==='monthly'?899:plan==='annual'?8999:null;
 if(!usdMinor||!Number.isSafeInteger(nowMs)||nowMs<0||
 typeof reference!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(reference))return deny('invalid_request');
 let url;
 try{url=new URL(fxEndpoint)}catch{return deny('fx_configuration_missing')}
 // No redirects or user-controlled URL. Operator must explicitly configure an HTTPS source.
 const frankfurterUrl='https://api.frankfurter.dev/v1/latest?base=USD&symbols=ZAR';
 const isFrankfurter=url.href===frankfurterUrl;
 if(url.protocol!=='https:'||url.username||url.password||url.hash||(!isFrankfurter&&url.search)||url.port||
 !/^[a-z0-9.-]+$/i.test(url.hostname)||url.hostname==='localhost'||url.hostname.endsWith('.local'))return deny('fx_configuration_invalid');
 let response;
 // Retry once for transient upstream/network failures. Both attempts use the
 // exact operator-configured endpoint and strict TLS/redirect policy.
 let lastError;
 for(let attempt=0;attempt<2;attempt++){
  try{
   response=await fetchImpl(url.href,{method:'GET',redirect:'manual',headers:{accept:'application/json'},signal:AbortSignal.timeout(8000)});
   break;
  }catch(error){lastError=error}
 }
 if(!response){
  // Keep failure closed, but distinguish a timeout from another fetch failure.
  const timeout=lastError?.name==='TimeoutError'||lastError?.name==='AbortError';
  // Only expose broad operational categories, never raw exception messages,
  // URLs, headers, secrets, stack traces, or provider response bodies.
  const cause=lastError?.cause;
  const code=typeof cause?.code==='string'?cause.code:'';
  const dnsCodes=new Set(['ENOTFOUND','EAI_AGAIN','DNS_ERROR']);
  const tlsCodes=new Set(['CERT_HAS_EXPIRED','UNABLE_TO_VERIFY_LEAF_SIGNATURE','ERR_TLS_CERT_ALTNAME_INVALID']);
  const networkCodes=new Set(['ECONNREFUSED','ECONNRESET','ENETUNREACH','EHOSTUNREACH']);
  const reason=timeout?'fx_provider_timeout':dnsCodes.has(code)?'fx_provider_dns_failure':
   tlsCodes.has(code)?'fx_provider_tls_failure':networkCodes.has(code)?'fx_provider_network_failure':'fx_provider_unavailable';
  return deny(reason);
 }
 // Cloudflare Workers does not implement redirect:error; reject redirects explicitly.
 if(response?.status>=300&&response.status<400)return deny('fx_provider_rejected');
 if(!response?.ok||!(response.headers.get('content-type')||'').toLowerCase().includes('application/json'))return deny('fx_provider_rejected');
 let payload;try{payload=await response.json()}catch{return deny('fx_response_invalid')}
 // Frankfurter's documented v1 format is {amount:1,base:'USD',date:'YYYY-MM-DD',rates:{ZAR:number}}.
 // Only transform this exact allowlisted endpoint; keep the existing trusted adapter contract.
 if(isFrankfurter){
  if(payload?.base!=='USD'||payload?.amount!==1||!payload?.rates||typeof payload.rates.ZAR!=='number')return deny('fx_response_invalid');
  payload={base:'USD',quote:'ZAR',rate:payload.rates.ZAR,asOf:payload.date};
 }
 if(payload?.base!=='USD'||payload?.quote!=='ZAR'||typeof payload.rate!=='number'||
 !Number.isFinite(payload.rate)||payload.rate<=0||payload.rate>1000||
 typeof payload.asOf!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(payload.asOf))return deny('fx_response_invalid');
 const observed=Date.parse(payload.asOf+'T00:00:00Z');
 // Daily reference rates may be stale over weekends/holidays; fail closed after 7 days.
 if(!Number.isFinite(observed)||observed>nowMs+86400000||nowMs-observed>7*86400000)return deny('fx_rate_stale');
 const zarMinor=Math.round(usdMinor*payload.rate);
 if(!Number.isSafeInteger(zarMinor)||zarMinor<=0)return deny('fx_amount_invalid');
 return {ok:true,quote:{source:'server_verified',environment:'sandbox',plan,usdMinor,zarMinor,
 settlementCurrency:'ZAR',fxReference:reference,issuedAtMs:nowMs,expiresAtMs:nowMs+10*60*1000},
 authorizesPayment:false};
}

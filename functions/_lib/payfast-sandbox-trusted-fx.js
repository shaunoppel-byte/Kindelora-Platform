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
 if(url.protocol!=='https:'||url.username||url.password||url.hash||url.search||url.port||
 !/^[a-z0-9.-]+$/i.test(url.hostname)||url.hostname==='localhost'||url.hostname.endsWith('.local'))return deny('fx_configuration_invalid');
 let response;
 try{response=await fetchImpl(url.href,{method:'GET',redirect:'error',headers:{accept:'application/json'},signal:AbortSignal.timeout(5000)})}catch{return deny('fx_provider_unavailable')}
 if(!response?.ok||!(response.headers.get('content-type')||'').toLowerCase().includes('application/json'))return deny('fx_provider_rejected');
 let payload;try{payload=await response.json()}catch{return deny('fx_response_invalid')}
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

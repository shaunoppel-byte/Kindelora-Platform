import assert from 'node:assert/strict';
import {issueTrustedSandboxFxQuote} from '../functions/_lib/payfast-sandbox-trusted-fx.js';
const nowMs=Date.now();
const asOf=new Date(nowMs).toISOString().slice(0,10);
let calls=0;
const fetchImpl=async(url,options)=>{
 calls++;
 assert.equal(url,'https://rates.example.org/daily');
 assert.equal(options.method,'GET');
 assert.equal(options.redirect,'manual');
 return new Response(JSON.stringify({base:'USD',quote:'ZAR',rate:18,asOf}),{headers:{'content-type':'application/json'}});
};
for(const [plan,usdMinor,zarMinor] of [['monthly',899,16182],['annual',8999,161982]]){
 const result=await issueTrustedSandboxFxQuote({plan,nowMs,reference:'fx_reference_123',fxEndpoint:'https://rates.example.org/daily',fetchImpl});
 assert.equal(result.ok,true);
 assert.equal(result.quote.usdMinor,usdMinor);
 assert.equal(result.quote.zarMinor,zarMinor);
 assert.equal(result.quote.settlementCurrency,'ZAR');
 assert.equal(result.quote.expiresAtMs,nowMs+600000);
 assert.equal(result.authorizesPayment,false);
}
assert.equal(calls,2);
const missing=await issueTrustedSandboxFxQuote({plan:'monthly',nowMs,reference:'fx_reference_123',fetchImpl});
assert.equal(missing.reason,'fx_configuration_missing');
assert.equal(calls,2);
console.log('PASS: server-only trusted USD/ZAR FX quote amounts and missing-provider fail-closed');

// Cloudflare Workers supports manual redirect handling; never accept an FX redirect.
let redirectedCalls=0;
const redirected=await issueTrustedSandboxFxQuote({plan:'monthly',nowMs,reference:'fx_reference_123',fxEndpoint:'https://rates.example.org/daily',fetchImpl:async(_url,options)=>{
 redirectedCalls++;
 assert.equal(options.redirect,'manual');
 return new Response(null,{status:302,headers:{location:'https://example.org/redirect','content-type':'application/json'}});
}});
assert.equal(redirected.ok,false);
assert.equal(redirected.reason,'fx_provider_rejected');
assert.equal(redirected.authorizesPayment,false);
assert.equal(redirectedCalls,1);
console.log('PASS: FX redirect rejected without following to another host');

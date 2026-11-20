import test from 'node:test';
import assert from 'node:assert/strict';
import {PLANS,validateSandboxQuote as check} from '../functions/_lib/payfast-sandbox-quote.js';
const now=1795200000000;
const quote={source:'server_verified',environment:'sandbox',plan:'monthly',usdMinor:899,settlementCurrency:'ZAR',zarMinor:15999,fxReference:'verified_quote_123',issuedAtMs:now-1000,expiresAtMs:now+60000};
test('approved USD plans and sandbox-only quote never authorize payment',()=>{
 assert.equal(PLANS.monthly.usdMinor,899);
 assert.equal(PLANS.annual.usdMinor,8999);
 assert.deepEqual(check(quote,'monthly',now),{ok:true,plan:'monthly',usdMinor:899,zarMinor:15999,fxReference:'verified_quote_123',environment:'sandbox',authorizesPayment:false});
 assert.equal(check({...quote,plan:'annual',usdMinor:8999},'annual',now).ok,true);
});
test('fail closed on untrusted, stale or malformed settlement quotes',()=>{
 for(const bad of [
 {source:'client'}, {environment:'production'}, {plan:'annual'}, {usdMinor:900},
 {settlementCurrency:'USD'}, {zarMinor:0}, {zarMinor:159.99}, {zarMinor:NaN},
 {fxReference:'x'}, {fxReference:'https://fake'}, {issuedAtMs:now+1},
 {expiresAtMs:now}, {expiresAtMs:now+16*60*1000}
 ])assert.equal(check({...quote,...bad},'monthly',now).ok,false,JSON.stringify(bad));
 assert.equal(check(quote,'unknown',now).ok,false);
 assert.equal(check(null,'monthly',now).ok,false);
});

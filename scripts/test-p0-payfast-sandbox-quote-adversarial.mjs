import assert from 'node:assert/strict';
import {PLANS,validateSandboxQuote} from '../functions/_lib/payfast-sandbox-quote.js';
const now=Date.parse('2026-11-21T04:48:00Z');
const make=(plan='monthly')=>({source:'server_verified',environment:'sandbox',plan,usdMinor:PLANS[plan].usdMinor,settlementCurrency:'ZAR',zarMinor:16750,fxReference:'fx_ref_12345',issuedAtMs:now-60000,expiresAtMs:now+60000});
for(const plan of ['monthly','annual']){
 const quote=make(plan),valid=validateSandboxQuote(quote,plan,now);
 assert.equal(valid.ok,true);
 assert.equal(valid.authorizesPayment,false);
 assert.equal(valid.usdMinor,plan==='monthly'?899:8999);
 for(const [key,value] of [
  ['source','client'],['environment','live'],['usdMinor',1],['plan',plan==='monthly'?'annual':'monthly'],
  ['settlementCurrency','USD'],['zarMinor',0],['zarMinor',1.2],['zarMinor',Number.MAX_SAFE_INTEGER+1],
  ['fxReference','invalid'],['issuedAtMs',now+1000],['expiresAtMs',now],
  ['expiresAtMs',now+16*60*1000]
 ]){const bad={...quote,[key]:value};assert.equal(validateSandboxQuote(bad,plan,now).ok,false,plan+' accepted '+key);}
}
assert.equal(validateSandboxQuote(make('monthly'),'not-a-plan',now).ok,false);
assert.equal(validateSandboxQuote(null,'monthly',now).ok,false);
assert.equal(validateSandboxQuote(make('monthly'),'monthly',NaN).ok,false);
console.log('PASS: server-authoritative sandbox quote guard; USD $8.99/$89.99; ZAR, FX, expiry, tamper and live-mode rejection (offline only)');

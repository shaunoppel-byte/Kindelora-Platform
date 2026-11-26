#!/usr/bin/env node
// P0: checkout must remain disabled until PayFast merchant activation is followed by
// server-verified subscription entitlements are released and tested.
import fs from 'node:fs';
import strictAssert from 'node:assert/strict';
import {onRequest} from '../functions/_middleware.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),js=read('app.js'),middleware=read('functions/_middleware.js');
const statusFallback=read('functions/api/plus/status.js');
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
const checkout=html.match(/<button\b[^>]*\bid="plus-checkout-button"[^>]*>/i);
assert(!!checkout,'PLUS checkout button missing');
assert(!!checkout&&/\sdisabled(?:\s|>|=)/i.test(checkout[0]),'PLUS checkout button is not disabled in initial HTML');
assert(/checkout\.disabled\s*=\s*true/.test(js),'PLUS checkout is not explicitly disabled in JavaScript');
assert(!/checkout\.disabled\s*=\s*false/.test(js),'PLUS checkout is enabled without release gate');
assert(/\/api\/plus\/status/.test(js),'Missing subscription availability request');
assert(middleware.includes('(?:plus|premium|members)'),'PLUS API namespace lacks fail-closed middleware');
// Both the global middleware and route fallback must remain fail-closed.
// This prevents a routing refactor from silently advertising checkout access.
for (const [name, source] of [['status fallback',statusFallback]]) {
  assert(/checkoutAvailable:\s*false/.test(source),`${name} does not explicitly disable checkout`);
  assert(/membershipVerificationAvailable:\s*false/.test(source),`${name} does not explicitly disable membership verification`);
  assert(/status:\s*'pending_secure_payment_integration'/.test(source),`${name} lacks pending secure integration state`);
  assert(/Cache-Control['"]?\s*:\s*['"]no-store, private/.test(source),`${name} does not prohibit caching PLUS readiness`);
}
assert(/path\s*===\s*'\/api\/plus\/status'/.test(middleware),'Public PLUS status exception missing from middleware');
assert(middleware.includes('pending_secure_payment_integration'),'Disabled state missing');
assert(html.includes('$8.99')&&html.includes('$89.99'),'Founder-approved USD prices missing or changed without release review');
console.log(JSON.stringify({check:'PLUS payment release guard',passed:failures.length===0,failures},null,2));
if(failures.length)process.exitCode=1;

const flags=["KINDELORA_PLUS_CHECKOUT_RELEASE_APPROVED","PAYFAST_LIVE_CHECKOUT_ENABLED","PAYFAST_LIVE_ITN_ENABLED","PAYFAST_LIVE_RECURRING_VERIFIED","PAYFAST_LIVE_INITIAL_RECURRING_LINK_ENABLED","PAYFAST_LIVE_RENEWAL_ITN_ENABLED"];
const configured=Object.fromEntries(flags.map(k=>[k,'true']));
for(const env of [{},configured,...flags.map(k=>({...configured,[k]:'false'}))]){
 const response=await onRequest({request:new Request('https://kindelora.pages.dev/api/plus/status'),env});
 const body=await response.json();
 strictAssert.equal(body.checkoutAvailable,flags.every(k=>env[k]==='true'));
 strictAssert.equal(body.membershipVerificationAvailable,false);
 strictAssert.equal(response.headers.get('Cache-Control'),'no-store, private');
}

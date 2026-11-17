#!/usr/bin/env node
// P0: checkout must remain disabled until PayFast merchant approval and
// server-verified subscription entitlements are released and tested.
import fs from 'node:fs';
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
for (const [name, source] of [['middleware',middleware],['status fallback',statusFallback]]) {
  assert(/checkoutAvailable:\s*false/.test(source),`${name} does not explicitly disable checkout`);
  assert(/membershipVerificationAvailable:\s*false/.test(source),`${name} does not explicitly disable membership verification`);
  assert(/status:\s*'pending_merchant_verification'/.test(source),`${name} lacks pending merchant verification state`);
  assert(/Cache-Control['"]?\s*:\s*['"]no-store, private/.test(source),`${name} does not prohibit caching PLUS readiness`);
}
assert(/path\s*===\s*'\/api\/plus\/status'/.test(middleware),'Public PLUS status exception missing from middleware');
assert(html.includes('Awaiting PayFast activation'),'Checkout availability messaging missing');
assert(html.includes('$6.99')&&html.includes('$69.99'),'Published indicative prices changed without release review');
console.log(JSON.stringify({check:'PLUS payment release guard',passed:failures.length===0,failures},null,2));
if(failures.length)process.exitCode=1;

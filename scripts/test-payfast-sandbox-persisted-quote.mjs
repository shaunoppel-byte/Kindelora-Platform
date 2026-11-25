import assert from 'node:assert/strict';
import {verifyPersistedSandboxQuote as verify} from '../functions/_lib/payfast-sandbox-persisted-quote.js';
const order={environment:'sandbox',status:'pending',reference:'order_12345678',fxReference:'quote_12345678',plan:'monthly',usdMinor:899,zarMinor:17000};
const row={quote_reference:order.fxReference,order_reference:order.reference,plan:'monthly',usd_minor:899,zar_minor:17000,settlement_currency:'ZAR',environment:'sandbox',source:'server_verified',expires_at_ms:200000};
const mock=value=>({prepare(){return {bind(a,b){assert.equal(a,order.fxReference);assert.equal(b,order.reference);return {first:async()=>value}}}}});
assert.equal((await verify({db:mock(row),order})).verified,true);
// A delayed PayFast ITN retry may arrive after the checkout quote's expiry.
// The order already captured that quote while it was valid, so expiry at
// callback time must not invalidate the completed payment notification.
assert.equal((await verify({db:mock({...row,expires_at_ms:1}),order})).verified,true);
for(const change of [{zar_minor:17001},{usd_minor:900},{plan:'annual'},{source:'client'},{expires_at_ms:0},{order_reference:'other_12345678'},{environment:'live'}])
 assert.equal((await verify({db:mock({...row,...change}),order})).verified,false);
assert.equal((await verify({db:null,order})).verified,false);
assert.equal((await verify({db:{prepare(){throw Error('no table')}},order})).verified,false);
console.log('PASS: persisted sandbox FX quote match and fail-closed tests');

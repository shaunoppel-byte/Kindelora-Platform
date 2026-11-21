import assert from 'node:assert/strict';
import {buildPayFastItnSignaturePayload as build} from '../functions/_lib/payfast-itn-signature-payload.js';
const signature='A'.repeat(32);
let r=build({raw:'merchant_id=10000100&item_name=Hello+World%21&empty=&amount_gross=170.00&signature='+signature,passphrase:'My Secret+'});
assert.equal(r.ok,true);
assert.equal(r.payload,'merchant_id=10000100&item_name=Hello+World%21&amount_gross=170.00&passphrase=My+Secret%2B');
assert.equal(r.signature,signature.toLowerCase());assert.equal(r.verified,false);
r=build({raw:'merchant_id=10000100&signature='+signature,passphrase:''});
assert.equal(r.payload,'merchant_id=10000100');
for(const raw of ['merchant_id=1&merchant_id=2&signature='+signature,'merchant_id=1&signature=nothex','merchant_id=1&passphrase=evil&signature='+signature,'merchant_id=1']){
 assert.equal(build({raw,passphrase:''}).ok,false);
}
assert.equal(build({raw:'merchant_id=1&signature='+signature,passphrase:null}).ok,false);
console.log('PASS: strict PayFast signature payload canonicalization, never claims verification');

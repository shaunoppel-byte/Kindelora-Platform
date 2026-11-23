import assert from 'node:assert/strict';
import {onRequestPost,onRequestGet} from '../functions/api/plus/checkout.js';
for(const env of [undefined,{}, {KINDELORA_PLUS_CHECKOUT_RELEASE_APPROVED:'false'},
 {KINDELORA_PLUS_CHECKOUT_RELEASE_APPROVED:'TRUE'}]){
 const response=await onRequestPost({env});
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,'checkout_unavailable');
}
// Even an explicitly approved release must fail closed when the independent
// authenticated checkout and PayFast readiness gates are not satisfied.
for(const env of [
 {KINDELORA_PLUS_CHECKOUT_RELEASE_APPROVED:'true'},
 {KINDELORA_PLUS_CHECKOUT_RELEASE_APPROVED:'true',PAYFAST_LIVE_CHECKOUT_ENABLED:'true'},
 {KINDELORA_PLUS_CHECKOUT_RELEASE_APPROVED:'true',PAYFAST_LIVE_CHECKOUT_ENABLED:'true',PAYFAST_LIVE_ITN_ENABLED:'true'}
]){
 const response=await onRequestPost({env});
 assert.equal(response.status,503,'release approval alone must never enable charging');
}
const response=await onRequestGet();
assert.equal(response.status,503);
console.log('PASS: PLUS checkout requires explicit release approval and GET remains disabled');

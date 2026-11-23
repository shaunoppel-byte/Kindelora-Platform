import assert from 'node:assert/strict';
import {onRequestPost,onRequestGet} from '../functions/api/plus/checkout.js';
for(const env of [undefined,{}, {KINDELORA_PLUS_CHECKOUT_RELEASE_APPROVED:'false'},
 {KINDELORA_PLUS_CHECKOUT_RELEASE_APPROVED:'TRUE'}]){
 const response=await onRequestPost({env});
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,'checkout_unavailable');
}
const response=await onRequestGet();
assert.equal(response.status,503);
console.log('PASS: PLUS checkout requires explicit release approval and GET remains disabled');

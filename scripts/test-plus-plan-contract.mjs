import assert from 'node:assert/strict';
import {resolvePlusPlan,approvedPlusPlans} from '../functions/_lib/plus-plan-contract.js';
assert.deepEqual(resolvePlusPlan({plan:'monthly'}),{ok:true,plan:'monthly',usdMinor:899,currency:'USD',periodMonths:1,authorizesPayment:false});
assert.deepEqual(resolvePlusPlan({plan:'annual'}),{ok:true,plan:'annual',usdMinor:8999,currency:'USD',periodMonths:12,authorizesPayment:false});
for(const bad of [null,{},[],{plan:'lifetime'},{plan:'Monthly'},{plan:1},{plan:'monthly',amountMinor:1},{plan:'annual',currency:'ZAR'},{plan:'monthly',memberId:'other'},{plan:'__proto__'}]){
 assert.equal(resolvePlusPlan(bad).ok,false,JSON.stringify(bad));
}
assert.deepEqual(approvedPlusPlans(),{monthly:{currency:'USD',amountMinor:899},annual:{currency:'USD',amountMinor:8999}});
console.log('PASS: server-only PLUS prices, exact plan allowlist, rejects client amounts/identity, no payment authorization');

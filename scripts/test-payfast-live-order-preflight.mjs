import assert from 'node:assert/strict';
import {prepareLiveOrderFacts as build} from '../functions/_lib/payfast-live-order-preflight.js';
const nowMs=Date.parse('2026-11-22T12:00:00Z');
const quote={environment:'live',source:'server_verified',plan:'monthly',usdMinor:899,zarMinor:16500,settlementCurrency:'ZAR',issuedAtMs:nowMs,expiresAtMs:nowMs+600000,fxReference:'fx_live_12345678'};
const args={plan:'monthly',verifiedMemberId:'member_12345678',reference:'order_12345678',quote,nowMs};
let r=build(args);assert.equal(r.ok,true);assert.equal(r.order.memberId,args.verifiedMemberId);assert.equal(r.order.zarMinor,16500);assert.equal(r.authorizesPayment,false);assert.equal(Object.isFrozen(r.order),true);
r=build({...args,plan:'annual',quote:{...quote,plan:'annual',usdMinor:8999}});assert.equal(r.ok,true);assert.equal(r.order.usdMinor,8999);
for(const invalid of [
 {plan:'weekly'}, {verifiedMemberId:''},{reference:'bad'},
 {quote:{...quote,environment:'sandbox'}},{quote:{...quote,source:'browser'}},
 {quote:{...quote,usdMinor:900}},{quote:{...quote,zarMinor:499}},
 {quote:{...quote,expiresAtMs:nowMs}},
 {quote:{...quote,expiresAtMs:nowMs+600001}},
 {quote:{...quote,issuedAtMs:nowMs+1}},
 {quote:{...quote,fxReference:'bad'}}
]){r=build({...args,...invalid});assert.equal(r.ok,false);assert.equal(r.authorizesPayment,false)}
console.log('PASS: live order preflight binds verified member, fixed plan, and unexpired trusted quote');

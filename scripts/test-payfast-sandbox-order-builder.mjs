import assert from 'node:assert/strict';
import {buildSandboxPendingOrder} from '../functions/_lib/payfast-sandbox-order-builder.js';
const nowMs=Date.UTC(2026,10,21,12,0,0);
const quote={source:'server_verified',environment:'sandbox',plan:'monthly',usdMinor:899,settlementCurrency:'ZAR',zarMinor:17000,fxReference:'fx_12345678',issuedAtMs:nowMs-1000,expiresAtMs:nowMs+60000};
const base={plan:'monthly',memberId:'member_12345678',reference:'order_12345678',quote,nowMs};
const good=buildSandboxPendingOrder(base);
assert.equal(good.ok,true);
assert.equal(good.authorizesPayment,false);
assert.deepEqual({plan:good.order.plan,usdMinor:good.order.usdMinor,zarMinor:good.order.zarMinor,status:good.order.status}, {plan:'monthly',usdMinor:899,zarMinor:17000,status:'pending'});
for(const patch of [{plan:'lifetime'},{memberId:''},{reference:'bad'},{quote:{...quote,usdMinor:1}},{quote:{...quote,zarMinor:-1}},{quote:{...quote,environment:'live'}},{quote:{...quote,source:'browser'}},{quote:{...quote,expiresAtMs:nowMs-1}},{nowMs:NaN}]){
 const bad=buildSandboxPendingOrder({...base,...patch});assert.equal(bad.ok,false,JSON.stringify(patch));assert.equal(bad.authorizesPayment,false);
}
const annual=buildSandboxPendingOrder({...base,plan:'annual',quote:{...quote,plan:'annual',usdMinor:8999}});
assert.equal(annual.ok,true);assert.equal(annual.order.usdMinor,8999);
console.log('PASS: server-verified FX quote, exact plan price, trusted sandbox pending order, no payment initiation');

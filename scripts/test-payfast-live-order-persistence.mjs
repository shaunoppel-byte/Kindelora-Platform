import assert from 'node:assert/strict';
import {persistLivePendingOrder as persist} from '../functions/_lib/payfast-live-order-persistence.js';
const nowMs=Date.parse('2026-11-22T12:00:00Z');
const order={environment:'live',status:'pending',memberId:'member_12345678',reference:'order_12345678',fxReference:'fx_live_12345678',plan:'monthly',usdMinor:899,zarMinor:16500,settlementCurrency:'ZAR',quoteExpiresAtMs:nowMs+600000};
let writes=0,lookups=0;
const db={prepare(sql){return {bind(...args){return {async first(){lookups++;return {id:'customer_12345678',identity_subject:'member_12345678'}},sql,args}}}},async batch(statements){writes++;assert.equal(statements.length,2);return [{success:true,meta:{changes:1}},{success:true,meta:{changes:1}}]}};
const args={db,order,verifiedMemberId:'member_12345678',customerId:'customer_12345678',nowMs};
let r=await persist(args);assert.equal(r.persisted,true);assert.equal(r.authorizesPayment,false);assert.equal(writes,1);assert.equal(lookups,1);
for(const overrides of [{verifiedMemberId:'member_other_1234'},{customerId:'bad'}, {order:{...order,environment:'sandbox'}},{order:{...order,zarMinor:100}},{order:{...order,quoteExpiresAtMs:nowMs}},{order:{...order,usdMinor:900}}]){
 writes=0;r=await persist({...args,...overrides});assert.equal(r.persisted,false);assert.equal(writes,0);
}
const wrongDb={...db,prepare(sql){return {bind(){return {async first(){return {id:'customer_12345678',identity_subject:'different_member'}}}}}}};
writes=0;r=await persist({...args,db:wrongDb});assert.equal(r.persisted,false);assert.equal(writes,0);
console.log('PASS: production pending order persistence enforces member ownership and trusted order facts');

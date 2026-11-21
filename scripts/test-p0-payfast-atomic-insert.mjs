import assert from 'node:assert/strict';
import {commitSandboxAtomicInsert as commit} from '../functions/_lib/payfast-sandbox-atomic-insert.js';
const decision={stage:'pending_atomic_commit',accepted:false,grantEntitlement:false,
 providerTransactionId:'provider_12345678',merchantReference:'order_12345678',paidMinor:17890,plan:'monthly'};
const order={environment:'sandbox',status:'pending',reference:'order_12345678',zarMinor:17890,plan:'monthly',memberId:'member_123'};
let calls=0;
const db={prepare(sql){assert.match(sql,/INSERT INTO payfast_atomic_transactions/);return {bind(...args){
 assert.deepEqual(args,['provider_12345678','order_12345678',17890]);
 return {async run(){calls++;return {meta:{changes:1}}}};
}}}};
assert.deepEqual(await commit({db,decision,order}),{committed:true,grantEntitlement:false,reason:'atomic_ledger_committed'});
for(const bad of [
 {order:{...order,status:'paid'}},
 {order:{...order,zarMinor:17891}},
 {order:{...order,environment:'live'}},
 {decision:{...decision,grantEntitlement:true}},
 {decision:{...decision,stage:'duplicate'}},
 {db:null}
])assert.equal((await commit({db,decision,order,...bad})).committed,false);
assert.equal(calls,1);
for(const response of [{meta:{changes:0}},null]){
 const failing={prepare(){return {bind(){return {async run(){return response}}}}}};
 assert.equal((await commit({db:failing,decision,order})).committed,false);
}
const throwing={prepare(){return {bind(){return {async run(){throw Error('private')}}}}}};
assert.equal((await commit({db:throwing,decision,order})).committed,false);
console.log('PASS: trigger-backed sandbox ledger insert is single-statement and fail-closed');

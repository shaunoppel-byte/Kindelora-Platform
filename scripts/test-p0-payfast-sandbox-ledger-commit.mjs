import assert from 'node:assert/strict';
import {commitVerifiedSandboxLedger as commit} from '../functions/_lib/payfast-sandbox-ledger-commit.js';
const decision={stage:'pending_atomic_commit',accepted:false,grantEntitlement:false,
 providerTransactionId:'provider_12345678',merchantReference:'order_12345678',paidMinor:17890,plan:'monthly'};
const order={environment:'sandbox',status:'pending',reference:'order_12345678',zarMinor:17890,plan:'monthly',memberId:'member_123'};
let calls=0;
const db={prepare(sql){return {bind(...args){return {sql,args}}}},async batch(statements){
 calls++;assert.equal(statements.length,2);
 return [{success:true,meta:{changes:1}},{success:true,meta:{changes:1}}];
}};
assert.deepEqual(await commit({db,decision,order}),{committed:true,grantEntitlement:false,reason:'ledger_committed'});
for(const bad of [
 {order:{...order,status:'paid'}},{order:{...order,zarMinor:17891}},
 {decision:{...decision,grantEntitlement:true}},
 {db:null}
])assert.equal((await commit({db,decision,order,...bad})).committed,false);
assert.equal(calls,1);
for(const response of [
 [{meta:{changes:1}},{meta:{changes:0}}],
 [{meta:{changes:0}},{meta:{changes:1}}],
 [{meta:{changes:1}}],null
]){
 const testdb={...db,batch:async()=>response};
 const result=await commit({db:testdb,decision,order});
 assert.equal(result.committed,false);
 assert.equal(result.grantEntitlement,false);
}
assert.equal((await commit({db:{...db,batch:async()=>{throw Error('private DB error')}},decision,order})).committed,false);
console.log('PASS: sandbox D1 batch success requires both writes; never grants entitlement');

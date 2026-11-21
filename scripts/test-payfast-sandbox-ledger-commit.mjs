import assert from 'node:assert/strict';
import {commitVerifiedSandboxLedger} from '../functions/_lib/payfast-sandbox-ledger-commit.js';
const order={environment:'sandbox',status:'pending',reference:'order_12345678',memberId:'member_12345678',plan:'monthly',zarMinor:17000};
const decision={stage:'pending_atomic_commit',accepted:false,grantEntitlement:false,providerTransactionId:'tx_12345678',merchantReference:order.reference,paidMinor:17000,plan:'monthly'};
const db=batch=>({prepare(sql){return {bind(...args){return {sql,args}}}},batch});
let seen;
let result=await commitVerifiedSandboxLedger({db:db(async s=>{seen=s;return [{success:true,meta:{changes:1}},{success:true,meta:{changes:1}}]}),decision,order});
assert.equal(result.committed,true);assert.equal(result.grantEntitlement,false);assert.equal(seen.length,2);
for(const batch of [async()=>{throw Error('duplicate')},async()=>[{success:true,meta:{changes:1}},{success:true,meta:{changes:0}}],async()=>[{success:false,meta:{changes:0}},{success:true,meta:{changes:1}}],async()=>[]]){
 result=await commitVerifiedSandboxLedger({db:db(batch),decision,order});assert.equal(result.committed,false);assert.equal(result.grantEntitlement,false);
}
result=await commitVerifiedSandboxLedger({db:db(async()=>{throw Error('unexpected')}),decision:{...decision,grantEntitlement:true},order});assert.equal(result.committed,false);
console.log('PASS: atomic sandbox ledger D1 batch, exact row counts, replay/error denial, no PLUS');

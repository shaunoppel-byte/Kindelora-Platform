import assert from 'node:assert/strict';
import {commitVerifiedSandboxLedger} from '../functions/_lib/payfast-sandbox-ledger-commit.js';
const order={environment:'sandbox',status:'pending',reference:'order_12345678',memberId:'member_12345678',plan:'monthly',zarMinor:17000};
const decision={stage:'pending_atomic_commit',accepted:false,grantEntitlement:false,providerTransactionId:'tx_12345678',merchantReference:order.reference,paidMinor:17000,plan:'monthly'};
const db=results=>({prepare(sql){return {bind(...args){return {sql,args}}}},async batch(){return results}});
const ok={success:true,meta:{changes:1}};
for(const results of [[ok,ok],[{success:false,meta:{changes:1}},ok],[ok,{success:false,meta:{changes:1}}],[{meta:{changes:1}},ok],[ok,{meta:{changes:1}}],[ok,{success:true,meta:{changes:0}}]]){
 const result=await commitVerifiedSandboxLedger({db:db(results),decision,order});
 assert.equal(result.committed,results[0]===ok&&results[1]===ok);
 assert.equal(result.grantEntitlement,false);
}
console.log('PASS: D1 batch must report success=true and exactly one change for both statements');

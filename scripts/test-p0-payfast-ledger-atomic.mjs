import assert from 'node:assert/strict';
import {sandboxLedgerAtomicStatements as plan} from '../functions/_lib/payfast-sandbox-ledger-atomic.js';
const statements=[];
const db={prepare(sql){return {bind(...args){statements.push({sql,args});return {sql,args}}}}};
const decision={stage:'pending_atomic_commit',accepted:false,grantEntitlement:false,
 providerTransactionId:'provider_12345678',merchantReference:'order_12345678',paidMinor:17890,plan:'monthly'};
const order={environment:'sandbox',status:'pending',reference:'order_12345678',zarMinor:17890,plan:'monthly',memberId:'member_123'};
const result=plan({db,decision,order});
assert.equal(result.length,2);
assert.equal(statements.length,2);
assert.match(statements[0].sql,/INSERT INTO payfast_sandbox_transactions/);
assert.match(statements[1].sql,/status='pending'/);
assert.deepEqual(statements[0].args,['provider_12345678','order_12345678',17890]);
for(const bad of [
 {decision:{...decision,grantEntitlement:true}},
 {decision:{...decision,stage:'rejected'}},
 {decision:{...decision,accepted:true}},
 {order:{...order,status:'paid'}},
 {order:{...order,zarMinor:17891}},
 {order:{...order,reference:'other_order'}},
 {order:{...order,plan:'annual'}},
 {order:{...order,environment:'live'}},
 {order:{...order,memberId:''}},
 {db:null}
])assert.equal(plan({db,decision,order,...bad}),null);
assert.equal(statements.length,2,'rejected requests must not prepare writes');
console.log('PASS: sandbox ledger SQL plan requires validated pending order; no DB writes performed');

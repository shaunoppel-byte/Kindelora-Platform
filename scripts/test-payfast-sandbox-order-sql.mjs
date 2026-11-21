import assert from 'node:assert/strict';
import {sandboxPendingOrderInsert} from '../functions/_lib/payfast-sandbox-order-sql.js';
const db={prepare(sql){return {bind(...args){return {sql,args}}}}};
const order={environment:'sandbox',status:'pending',reference:'order_12345678',memberId:'member_12345678',plan:'monthly',usdMinor:899,zarMinor:17000,settlementCurrency:'ZAR',fxReference:'fx_12345678',quoteExpiresAtMs:Date.now()+60000};
const statement=sandboxPendingOrderInsert({db,order});
assert.match(statement.sql,/INSERT INTO payfast_sandbox_orders/);
assert.deepEqual(statement.args.slice(0,4),['order_12345678','member_12345678','monthly',899]);
for(const patch of [{status:'paid'},{environment:'live'},{usdMinor:1},{zarMinor:0},{plan:'unknown'},{quoteExpiresAtMs:Date.now()-1000},{memberId:''},{settlementCurrency:'USD'}]){
 assert.equal(sandboxPendingOrderInsert({db,order:{...order,...patch}}),null,JSON.stringify(patch));
}
assert.equal(sandboxPendingOrderInsert({db:{},order}),null);
console.log('PASS: sandbox pending order SQL is parameterized, immutable priced, unexpired and never executed');

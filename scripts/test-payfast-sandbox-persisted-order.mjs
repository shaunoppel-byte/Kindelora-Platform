import assert from 'node:assert/strict';
import {loadPendingSandboxOrder as load} from '../functions/_lib/payfast-sandbox-persisted-order.js';
const row={order_reference:'order_12345678',member_id:'member_12345678',plan:'monthly',usd_minor:899,zar_minor:17000,fx_reference:'quote_12345678',status:'pending'};
const db=record=>({prepare(sql){assert.ok(sql.includes('WHERE order_reference=?'));return {bind(ref){assert.equal(ref,row.order_reference);return {async first(){return record}}}}}});
let r=await load({db:db(row),reference:row.order_reference});
assert.equal(r.ok,true);assert.equal(r.order.zarMinor,17000);assert.equal(r.grantEntitlement,false);
for(const changed of [{...row,status:'paid'},{...row,usd_minor:1},{...row,zar_minor:0},{...row,plan:'unknown'},{...row,member_id:''},{...row,fx_reference:''},null]){
 r=await load({db:db(changed),reference:row.order_reference});assert.equal(r.ok,false);
}
r=await load({db:db(row),reference:"' OR 1=1 --"});assert.equal(r.ok,false);
r=await load({db:{prepare(){throw Error('private SQL details')}},reference:row.order_reference});assert.equal(r.ok,false);assert.ok(!JSON.stringify(r).includes('private'));
console.log('PASS: sandbox ITN order is derived from trusted D1 pending row, never browser amounts');

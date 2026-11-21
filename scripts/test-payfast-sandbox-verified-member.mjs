import assert from 'node:assert/strict';
import {verifySandboxOrderMember as verify} from '../functions/_lib/payfast-sandbox-verified-member.js';
const order={environment:'sandbox',status:'pending',memberId:'member_12345678'};
const db=row=>({prepare(sql){assert.ok(sql.includes('FROM members WHERE id=?'));return {bind(id){assert.equal(id,order.memberId);return {async first(){return row}}}}}});
let r=await verify({db:db({id:order.memberId,email_verified_at:'2026-11-21T00:00:00Z',disabled_at:null}),order});
assert.deepEqual(r,{verified:true,reason:'verified_member',grantEntitlement:false});
for(const row of [null,{id:'other',email_verified_at:'yes',disabled_at:null},{id:order.memberId,email_verified_at:null,disabled_at:null},{id:order.memberId,email_verified_at:'yes',disabled_at:'now'}]){
 r=await verify({db:db(row),order});assert.equal(r.verified,false);assert.equal(r.grantEntitlement,false);
}
r=await verify({db:db(null),order:{...order,memberId:"' OR 1=1 --"}});assert.equal(r.verified,false);
r=await verify({db:{prepare(){throw Error('private db secret')}},order});assert.equal(r.verified,false);assert.ok(!JSON.stringify(r).includes('secret'));
console.log('PASS: sandbox member identity derived from verified D1 account, fail closed');

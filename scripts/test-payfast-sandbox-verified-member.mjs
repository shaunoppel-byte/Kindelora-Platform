import assert from 'node:assert/strict';
import {verifySandboxOrderMember as verify} from '../functions/_lib/payfast-sandbox-verified-member.js';
const order={environment:'sandbox',status:'pending',memberId:'member_12345678'};
const sandboxMember={id:order.memberId,email_normalized:order.memberId+'@sandbox.invalid',disabled_at:'2026-11-24 12:00:00'};
const db=row=>({prepare(sql){assert.ok(sql.includes('FROM members WHERE id=?'));assert.ok(sql.includes('email_normalized'));return {bind(id){assert.equal(id,order.memberId);return {async first(){return row}}}}}});
let r=await verify({db:db(sandboxMember),order});
assert.deepEqual(r,{verified:true,reason:'sandbox_identity_verified',grantEntitlement:false});
for(const row of [
 null,
 {id:'other',email_normalized:order.memberId+'@sandbox.invalid',disabled_at:'now'},
 {id:order.memberId,email_normalized:'person@example.com',disabled_at:'now'},
 {id:order.memberId,email_normalized:'other@sandbox.invalid',disabled_at:'now'},
 {id:order.memberId,email_normalized:order.memberId+'@sandbox.invalid',disabled_at:null},
 {id:order.memberId,email_normalized:order.memberId+'@sandbox.invalid'}
]){
 r=await verify({db:db(row),order});assert.equal(r.verified,false);assert.equal(r.grantEntitlement,false);
}
r=await verify({db:db(null),order:{...order,memberId:"' OR 1=1 --"}});assert.equal(r.verified,false);
r=await verify({db:{prepare(){throw Error('private db secret')}},order});assert.equal(r.verified,false);assert.ok(!JSON.stringify(r).includes('secret'));
console.log('PASS: ITN validates only its disabled pseudonymous Sandbox D1 member; no entitlement granted');

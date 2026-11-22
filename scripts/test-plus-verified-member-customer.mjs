import assert from 'node:assert/strict';
import {ensurePlusCustomerForVerifiedMember as ensure} from '../functions/_lib/plus-verified-member-customer.js';
const rows=new Map();let inserts=0;
const db={prepare(sql){return {bind(...args){return {async run(){inserts++;if(!rows.has(args[1]))rows.set(args[1],args[0]);return {success:true}},async first(){const id=rows.get(args[0]);return id?{id,identity_subject:args[0]}:null}}}}}};
const member='member_12345678';let r=await ensure({db,verifiedMemberId:member,customerId:'customer_12345678'});assert.equal(r.mapped,true);assert.equal(r.customerId,'customer_12345678');assert.equal(r.authorizesPayment,false);
r=await ensure({db,verifiedMemberId:member,customerId:'customer_87654321'});assert.equal(r.mapped,true);assert.equal(r.customerId,'customer_12345678');assert.equal(inserts,2);
for(const invalid of [{verifiedMemberId:'bad'},{customerId:'bad'},{db:null}])assert.equal((await ensure({db,verifiedMemberId:member,customerId:'customer_12345678',...invalid})).mapped,false);
const broken={prepare(){throw new Error('unavailable')}};assert.equal((await ensure({db:broken,verifiedMemberId:member,customerId:'customer_12345678'})).mapped,false);
console.log('PASS: PLUS customer identity mapping is idempotent and never grants payment access');

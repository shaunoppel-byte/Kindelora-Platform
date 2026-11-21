// Executes the real email verification handler with synthetic D1 results.
// Offline test: no Resend, inbox, production account, or database access.
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/member/verify-email.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const token='a'.repeat(64), pepper='synthetic-pepper-0123456789abcdef0123456789';
let consumed=false, memberCreated=false, failBatch=false, calls=0;
const db={prepare(sql){return {bind(...args){return {sql,args}}}},async batch(stmts){
 calls++;
 assert.equal(stmts.length,2);
 assert.match(stmts[0].sql,/UPDATE member_email_verifications/);
 assert.match(stmts[1].sql,/INSERT INTO members/);
 assert.equal(stmts[0].args[2],stmts[1].args[2]);
 assert.equal(stmts[0].args[1],stmts[1].args[3]);
 if(failBatch)throw Error('synthetic db unavailable');
 if(consumed)return [{meta:{changes:0}},{meta:{changes:0}}];
 consumed=true;memberCreated=true;
 return [{meta:{changes:1}},{meta:{changes:1}}];
}};
const env={PUBLIC_REGISTRATION_ENABLED:'true',MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper,DB:db};
async function verify(value=token,origin='https://kindelora.pages.dev',override=env){
 const request=new Request('https://kindelora.pages.dev/api/member/verify-email',{
 method:'POST',headers:{origin,'content-type':'application/json'},
 body:JSON.stringify({token:value})});
 return onRequestPost({request,env:override});
}
assert.equal((await verify('invalid')).status,400);
assert.equal((await verify(token,'https://attacker.invalid')).status,403);
assert.equal((await verify(token,undefined,{...env,PUBLIC_REGISTRATION_ENABLED:'false'})).status,503);
assert.equal(calls,0);
const good=await verify();
assert.equal(good.status,200);
assert.deepEqual(await good.json(),{verified:true,signInRequired:true});
assert.equal(memberCreated,true);
assert.equal((await verify()).status,409);
assert.equal(calls,2);
consumed=false;failBatch=true;
assert.equal((await verify()).status,409);
assert.equal(calls,3);
console.log('PASS: actual verification handler validates token/origin, atomically claims once, rejects replay and DB failure');

import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/member/confirm-password-reset.js';
const env={MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'a'.repeat(40),DB:{prepare(){throw Error('unexpected database access')}}};
const req=(token,password='valid-password-123',origin='https://kindelora.pages.dev')=>new Request('https://kindelora.pages.dev/api/member/confirm-password-reset',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({token,password})});
test('confirmation is disabled by default before any DB access',async()=>{
 const res=await onRequestPost({request:req('a'.repeat(64)),env});assert.equal(res.status,503);
});
test('origin validation precedes token processing and DB access',async()=>{
 const res=await onRequestPost({request:req('a'.repeat(64),'valid-password-123','https://attacker.example'),env:{...env,MEMBER_PASSWORD_RECOVERY_ENABLED:'true'}});
 assert.equal(res.status,403);
});
test('invalid token and weak password rejected without DB access',async()=>{
 for(const [token,password] of [['invalid','valid-password-123'],['a'.repeat(64),'short']]){
  const res=await onRequestPost({request:req(token,password),env:{...env,MEMBER_PASSWORD_RECOVERY_ENABLED:'true'}});
  assert.equal(res.status,400);
 }
});

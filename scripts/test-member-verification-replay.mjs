import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/member/verify-email.js';

test('verification token can activate exactly once; replay is rejected',async()=>{
 const priorCrypto=globalThis.crypto;
 try {
  if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{configurable:true,value:webcrypto});
  let consumed=false,memberInserted=false,claimNonce;
  const DB={prepare(sql){return {bind(...args){return {sql,args};}}},async batch(statements){
   assert.equal(statements.length,2);
   assert.match(statements[0].sql,/consumed_at IS NULL/);
   assert.match(statements[0].sql,/expires_at>\?/);
   assert.match(statements[1].sql,/consumed_nonce=\?/);
   assert.equal(statements[0].args[1],statements[1].args[3]);
   if(consumed)return [{meta:{changes:0}},{meta:{changes:0}}];
   consumed=true;claimNonce=statements[0].args[1];memberInserted=true;
   return [{meta:{changes:1}},{meta:{changes:1}}];
  }};
  const env={PUBLIC_REGISTRATION_ENABLED:'true',MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'p'.repeat(40),DB};
  const token='a'.repeat(64);
  const call=()=>onRequestPost({env,request:new Request('https://kindelora.pages.dev/api/member/verify-email',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({token})})});
  const first=await call();assert.equal(first.status,200);assert.equal((await first.json()).verified,true);
  const second=await call();assert.equal(second.status,409);
  assert.equal(memberInserted,true);assert.match(claimNonce,/^[a-f0-9-]{36}$/);
 }finally{if(!priorCrypto)delete globalThis.crypto;}
});

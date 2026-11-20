import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/member/login.js';

test('verified member can login and receive secure session, without PLUS entitlement',async()=>{
 const priorCrypto=globalThis.crypto;
 try{
  if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{configurable:true,value:webcrypto});
  const password='offline-only-test-password',salt='offline-only-salt';
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const passwordHash=Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:310000,hash:'SHA-256'},key,256)),b=>b.toString(16).padStart(2,'0')).join('');
  let sessionCreated=false,rateLimitCleared=false;
  const DB={prepare(sql){return {bind(...args){return {
   async first(){
    if(sql.startsWith('SELECT failures'))return null;
    if(sql.startsWith('SELECT id,email_normalized'))return {id:'offline-member',email_normalized:'offline@example.invalid',password_salt:salt,password_hash:passwordHash,email_verified_at:'2026-11-20T00:00:00.000Z',disabled_at:null};
    throw Error('Unexpected SELECT');
   },
   async run(){
    if(sql.startsWith('DELETE FROM member_login_limits')){rateLimitCleared=true;return {success:true};}
    if(sql.startsWith('INSERT INTO member_sessions')){assert.match(args[0],/^[a-f0-9]{64}$/);assert.equal(args[1],'offline-member');sessionCreated=true;return {success:true};}
    throw Error('Unexpected write');
   }
  };}}}};
  const env={MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'p'.repeat(40),DB};
  const request=new Request('https://kindelora.pages.dev/api/member/login',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({email:'offline@example.invalid',password})});
  const response=await onRequestPost({request,env});
  assert.equal(response.status,200);
  assert.equal((await response.json()).authenticated,true);
  assert.equal(sessionCreated,true);assert.equal(rateLimitCleared,true);
  const cookie=response.headers.get('set-cookie');
  for(const flag of ['HttpOnly','Secure','SameSite=Strict','Path=/api'])assert.ok(cookie.includes(flag),flag);
  assert.ok(!cookie.includes(password));
 }finally{if(!priorCrypto)delete globalThis.crypto;}
});

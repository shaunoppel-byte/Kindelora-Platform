import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/member/login.js';

test('unsupported PBKDF2 rejects login safely without creating session or rate-limit failure',async()=>{
 const prior=globalThis.crypto,priorLog=console.info,logs=[];
 let created=false;
 try{
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{...webcrypto,subtle:{digest:(...args)=>webcrypto.subtle.digest(...args),importKey:()=>Promise.reject(new Error('iteration counts above 100000 are not supported'))}}});
  console.info=(...args)=>logs.push(args);
  const DB={prepare(sql){return {bind(){return {async first(){if(sql.startsWith('SELECT failures'))return null;if(sql.startsWith('SELECT id,email_normalized'))return null;throw Error('unexpected query');},async run(){created=true;throw Error('no write expected');}}}}}};
  const env={MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'p'.repeat(40),DB};
  const request=new Request('https://kindelora.pages.dev/api/member/login',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({email:'offline@example.invalid',password:'test-password'})});
  const response=await onRequestPost({request,env});
  assert.equal(response.status,503);assert.equal(created,false);
  assert.deepEqual(logs,[['member_login_outcome','password_derivation_failed']]);
  assert.equal(response.headers.get('set-cookie'),null);
 }finally{console.info=priorLog;if(prior)Object.defineProperty(globalThis,'crypto',{configurable:true,value:prior});else delete globalThis.crypto;}
});

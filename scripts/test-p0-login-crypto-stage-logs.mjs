// Offline-only: fixed private diagnostic codes, no credentials in logs or response.
import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/member/login.js';
const pepper='p'.repeat(40),email='synthetic@example.invalid',password='synthetic-private-password';
const originalCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto'),originalInfo=console.info;
try{
 const calls=[];
 console.info=(...args)=>calls.push(args);
 const original=globalThis.crypto;
 Object.defineProperty(globalThis,'crypto',{configurable:true,value:{
  ...original,
  subtle:{...original.subtle,digest:(...args)=>original.subtle.digest(...args),importKey:async()=>{throw Error('SENSITIVE_SYNTHETIC_CRYPTO_ERROR')}}
 }});
 for(const [salt,expected] of [['v2:synthetic','v2'],['legacy-synthetic','legacy'],[null,'missing_account']]){
  calls.length=0;
  const user=salt?{id:'synthetic',email_normalized:email,password_salt:salt,password_hash:'x',email_verified_at:'2026-11-20T00:00:00Z',disabled_at:null}:null;
  const db={prepare(sql){return {bind(){return {async first(){return sql.includes('FROM members WHERE')?user:null}}}}}};
  const request=new Request('https://kindelora.pages.dev/api/member/login',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({email,password})});
  const response=await onRequestPost({request,env:{DB:db,MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper}});
  assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{error:'Member login temporarily unavailable'});
  assert.deepEqual(calls,[['member_login_outcome','password_derivation_failed',expected]]);
  const logs=JSON.stringify(calls);
  for(const forbidden of [email,password,pepper,'SENSITIVE_SYNTHETIC_CRYPTO_ERROR'])assert.ok(!logs.includes(forbidden));
 }
}finally{
 console.info=originalInfo;
 if(originalCrypto)Object.defineProperty(globalThis,'crypto',originalCrypto);
 else delete globalThis.crypto;
}
console.log('PASS: offline privacy-safe login crypto stage diagnostics and unchanged HTTP 503');

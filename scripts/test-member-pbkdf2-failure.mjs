import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/member/registration-request.js';

test('PBKDF2 runtime rejection fails closed before D1 token insert or Resend delivery',async()=>{
 const oldFetch=globalThis.fetch,oldCrypto=globalThis.crypto,oldInfo=console.info;
 let providerCalls=0,verificationWrites=0;
 const audit=[];
 try{
  const failingCrypto={getRandomValues:array=>webcrypto.getRandomValues(array),subtle:{
   digest:(...args)=>webcrypto.subtle.digest(...args),
   importKey:(...args)=>webcrypto.subtle.importKey(...args),
   deriveBits:async options=>{assert.equal(options.iterations,310000);throw new Error('simulated workerd PBKDF2 failure');}
  }};
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:failingCrypto});
  console.info=(...args)=>{audit.push(args.join(' '));};
  globalThis.fetch=async url=>{
   if(url==='https://challenges.cloudflare.com/turnstile/v0/siteverify')return new Response(JSON.stringify({success:true,hostname:'kindelora.pages.dev'}));
   if(url==='https://api.resend.com/emails'){providerCalls++;throw Error('Resend must not be called');}
   throw Error('Unexpected network');
  };
  const DB={prepare(sql){return {bind(){return {
   async first(){if(sql.startsWith('SELECT attempts')||sql.startsWith('SELECT id FROM members'))return null;throw Error('Unexpected SELECT');},
   async run(){if(sql.startsWith('INSERT INTO member_registration_limits'))return {success:true};verificationWrites++;throw Error('Unexpected write');}
  };}}}};
  const env={PUBLIC_REGISTRATION_ENABLED:'true',MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'p'.repeat(40),TURNSTILE_SECRET_KEY:'offline-secret',RESEND_API_KEY:'re_offline',REGISTRATION_FROM_EMAIL:'noreply@example.invalid',DB};
  const request=new Request('https://kindelora.pages.dev/api/member/registration-request',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({email:'offline@example.invalid',password:'offline-test-password',turnstileToken:'test'})});
  const response=await onRequestPost({request,env});
  assert.equal(response.status,503);
  assert.equal(providerCalls,0);assert.equal(verificationWrites,0);
  assert.ok(audit.includes('member_registration_outcome password_derivation_failed'));
  assert.ok(!audit.join(' ').includes('offline@example.invalid'));
  assert.ok(!audit.join(' ').includes('offline-test-password'));
 }finally{
  globalThis.fetch=oldFetch;console.info=oldInfo;
  if(oldCrypto===undefined)delete globalThis.crypto;
  else Object.defineProperty(globalThis,'crypto',{configurable:true,value:oldCrypto});
 }
});

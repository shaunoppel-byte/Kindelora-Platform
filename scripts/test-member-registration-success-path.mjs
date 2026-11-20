import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/member/registration-request.js';

test('registration reaches provider acknowledgement and stores a pending verification in an isolated fake D1',async()=>{
 const originalFetch=globalThis.fetch;
 const originalCrypto=globalThis.crypto;
 let emailAccepted=false,stored=false,limitWritten=false;
 const sqlCalls=[];
 const DB={prepare(sql){
  sqlCalls.push(sql);
  return {bind(...params){return {
   async first(){
    if(sql.startsWith('SELECT attempts'))return null;
    if(sql.startsWith('SELECT id FROM members'))return null;
    throw Error('Unexpected D1 first');
   },
   async run(){
    if(sql.startsWith('INSERT INTO member_registration_limits')){limitWritten=true;return {success:true};}
    if(sql.startsWith('INSERT INTO member_email_verifications')){
     assert.match(params[0],/^[a-f0-9]{64}$/);
     assert.equal(params[1],'offline-test@example.invalid');
     assert.match(params[3],/^[a-f0-9]{64}$/);
     assert.notEqual(params[3],'offline-test-password-only');
     stored=true;return {success:true};
    }
    throw Error('Unexpected D1 run');
   }
  };}};
 }};
 try{
  if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{configurable:true,value:webcrypto});
  globalThis.fetch=async(url,options)=>{
   if(url==='https://challenges.cloudflare.com/turnstile/v0/siteverify'){
    assert.equal(options.method,'POST');
    return new Response(JSON.stringify({success:true,hostname:'kindelora.pages.dev'}),{status:200});
   }
   if(url==='https://api.resend.com/emails'){
    assert.equal(stored,true,'verification record must exist before email send');
    const payload=JSON.parse(options.body);
    assert.deepEqual(payload.to,['offline-test@example.invalid']);
    assert.match(payload.text,/plus-account.html\\?verify=/);
    emailAccepted=true;
    return new Response(JSON.stringify({id:'offline-provider-ack'}),{status:200});
   }
   throw Error('Unexpected network call');
  };
  const env={PUBLIC_REGISTRATION_ENABLED:'true',MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'p'.repeat(40),TURNSTILE_SECRET_KEY:'offline-secret',RESEND_API_KEY:'re_offline',REGISTRATION_FROM_EMAIL:'KINDELORA <noreply@oppelenterprises.co.za>',DB};
  const request=new Request('https://kindelora.pages.dev/api/member/registration-request',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json','cf-connecting-ip':'127.0.0.1'},body:JSON.stringify({email:'offline-test@example.invalid',password:'offline-test-password-only',turnstileToken:'offline-challenge'})});
  const response=await onRequestPost({request,env});
  assert.equal(response.status,202,await response.text().catch(()=>''));
  assert.equal(limitWritten,true);
  assert.equal(stored,true);
  assert.equal(emailAccepted,true);
  assert.equal(sqlCalls.some(s=>s.startsWith('DELETE FROM member_email_verifications')),false);
 }finally{
  globalThis.fetch=originalFetch;
  if(!originalCrypto)delete globalThis.crypto;
 }
});

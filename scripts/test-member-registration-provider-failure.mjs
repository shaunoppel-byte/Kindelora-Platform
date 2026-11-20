import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { onRequestPost } from '../functions/api/member/registration-request.js';

test('failed verification email never returns signup success and removes only its pending token', async () => {
 const priorFetch=globalThis.fetch, priorCrypto=globalThis.crypto;
 let insertedToken, removedToken, providerCalls=0;
 const DB={prepare(sql){return {bind(...args){return {
  async first(){if(sql.startsWith('SELECT attempts')||sql.startsWith('SELECT id FROM members'))return null;throw Error('Unexpected SELECT');},
  async run(){
   if(sql.startsWith('INSERT INTO member_registration_limits'))return {success:true};
   if(sql.startsWith('INSERT INTO member_email_verifications')){insertedToken=args[0];return {success:true};}
   if(sql.startsWith('DELETE FROM member_email_verifications')){removedToken=args[0];assert.match(sql,/WHERE token_hash=\? AND consumed_at IS NULL/);return {success:true};}
   throw Error('Unexpected D1 write');
  }
 };}}}};
 try {
  if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{configurable:true,value:webcrypto});
  globalThis.fetch=async url=>{
   if(url==='https://challenges.cloudflare.com/turnstile/v0/siteverify')return new Response(JSON.stringify({success:true,hostname:'kindelora.pages.dev'}),{status:200});
   if(url==='https://api.resend.com/emails'){providerCalls++;return new Response(JSON.stringify({message:'offline provider rejected'}),{status:503});}
   throw Error('Unexpected network request');
  };
  const env={PUBLIC_REGISTRATION_ENABLED:'true',MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'p'.repeat(40),TURNSTILE_SECRET_KEY:'offline-secret',RESEND_API_KEY:'re_offline',REGISTRATION_FROM_EMAIL:'KINDELORA <noreply@example.invalid>',DB};
  const request=new Request('https://kindelora.pages.dev/api/member/registration-request',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({email:'offline-test@example.invalid',password:'offline-test-password-only',turnstileToken:'offline-challenge'})});
  const response=await onRequestPost({request,env});
  assert.equal(response.status,503);
  assert.equal(providerCalls,1);
  assert.match(insertedToken,/^[a-f0-9]{64}$/);
  assert.equal(removedToken,insertedToken);
 } finally {globalThis.fetch=priorFetch;if(!priorCrypto)delete globalThis.crypto;}
});

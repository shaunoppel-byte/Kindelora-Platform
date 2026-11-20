import test from 'node:test';
import assert from 'node:assert/strict';
import {sendPasswordRecovery} from '../functions/_lib/member-password-recovery-delivery.js';
const env={RESEND_API_KEY:'re_synthetic_test_only',REGISTRATION_FROM_EMAIL:'KINDELORA <support@example.com>'};
const token='a'.repeat(64),email='test@example.com',origin='https://kindelora.pages.dev';
test('rejects untrusted origins and invalid tokens before any email call',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('must not call')};
 try{
  await assert.rejects(sendPasswordRecovery(env,{email,token,origin:'https://evil.example'}));
  await assert.rejects(sendPasswordRecovery(env,{email,token:'invalid',origin}));
  await assert.rejects(sendPasswordRecovery({...env,RESEND_API_KEY:''},{email,token,origin}));
  assert.equal(calls,0);
 }finally{globalThis.fetch=original;}
});
test('sends only trusted HTTPS reset link with 15-minute expiry wording',async()=>{
 const original=globalThis.fetch;let call;
 globalThis.fetch=async(url,opts)=>{call={url,opts};return {ok:true,json:async()=>({id:'synthetic-email-id'})}};
 try{
  assert.deepEqual(await sendPasswordRecovery(env,{email,token,origin}),{accepted:true});
  assert.equal(call.url,'https://api.resend.com/emails');
  const body=JSON.parse(call.opts.body);
  assert.deepEqual(body.to,[email]);
  assert.match(body.text,/https:\/\/kindelora\.pages\.dev\/plus-account\.html\?reset=/);
  assert.match(body.text,/15 minutes/);
  assert.doesNotMatch(body.text,/verify=/);
 }finally{globalThis.fetch=original;}
});
test('provider failure fails closed without claiming delivery',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>({ok:false,status:503});
 try{await assert.rejects(sendPasswordRecovery(env,{email,token,origin}));}finally{globalThis.fetch=original;}
});

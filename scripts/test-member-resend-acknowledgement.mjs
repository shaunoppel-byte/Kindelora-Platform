import test from 'node:test';
import assert from 'node:assert/strict';
import {sendRegistrationVerification as send} from '../functions/_lib/member-verification-delivery.js';
const env={PUBLIC_REGISTRATION_ENABLED:'true',RESEND_API_KEY:'re_offline_dummy',REGISTRATION_FROM_EMAIL:'KINDELORA <noreply@oppelenterprises.co.za>'};
const args={email:'recipient@example.invalid',token:'a'.repeat(64),origin:'https://kindelora.pages.dev'};
const original=globalThis.fetch;
test('provider 2xx with id is only API acknowledgement, not inbox delivery',async()=>{
 let calls=0;globalThis.fetch=async(url,init)=>{calls++;assert.equal(url,'https://api.resend.com/emails');assert.match(init.headers.Authorization,/^Bearer re_/);const body=JSON.parse(init.body);assert.equal(body.to[0],args.email);assert.match(body.text,/verify=/);return {ok:true,json:async()=>({id:'offline-provider-id'})}};
 try{assert.deepEqual(await send(env,args),{accepted:true});assert.equal(calls,1)}finally{globalThis.fetch=original}
});
test('provider errors and missing id fail closed',async()=>{
 try{
  for(const response of [{ok:false},{ok:true,json:async()=>({})}]){
   globalThis.fetch=async()=>response;
   await assert.rejects(send(env,args));
  }
 }finally{globalThis.fetch=original}
});
test('untrusted origin or missing provider key never calls provider',async()=>{
 let called=false;globalThis.fetch=async()=>{called=true;throw Error('should not call')};
 try{
  await assert.rejects(send(env,{...args,origin:'https://evil.example'}));
  await assert.rejects(send({...env,RESEND_API_KEY:''},args));
  assert.equal(called,false)
 }finally{globalThis.fetch=original}
});

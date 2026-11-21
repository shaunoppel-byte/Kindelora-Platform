import assert from 'node:assert/strict';
import {sendRegistrationVerification} from '../functions/_lib/member-verification-delivery.js';
const env={PUBLIC_REGISTRATION_ENABLED:'true',RESEND_API_KEY:'re_test_only',REGISTRATION_FROM_EMAIL:'KINDELORA <verify@example.com>'};
const args={email:'member@example.com',token:'a'.repeat(64),origin:'https://kindelora.pages.dev'};
const previous=globalThis.fetch;
try {
 let invoked=false;
 globalThis.fetch=async(url,options)=>{invoked=true;assert.equal(url,'https://api.resend.com/emails');assert.ok(options.signal instanceof AbortSignal);assert.equal(options.method,'POST');return {ok:true,json:async()=>({id:'test_message_id'})}};
 assert.deepEqual(await sendRegistrationVerification(env,args),{accepted:true});assert.equal(invoked,true);
 globalThis.fetch=async()=>{throw new DOMException('Timeout','TimeoutError')};
 await assert.rejects(()=>sendRegistrationVerification(env,args),/Timeout/);
 globalThis.fetch=async()=>({ok:false});
 await assert.rejects(()=>sendRegistrationVerification(env,args),/delivery failed/);
} finally {globalThis.fetch=previous}
console.log('PASS: Resend bounded delivery and provider failure remain fail-closed');

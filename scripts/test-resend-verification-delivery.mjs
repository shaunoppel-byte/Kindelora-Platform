import assert from 'node:assert/strict';
import {sendRegistrationVerification} from '../functions/_lib/member-verification-delivery.js';
const originalFetch=globalThis.fetch;
const env={PUBLIC_REGISTRATION_ENABLED:'true',RESEND_API_KEY:'re_test_only_not_real',REGISTRATION_FROM_EMAIL:'KINDELORA <hello@oppelenterprises.co.za>'};
const params={email:'person@example.test',token:'a'.repeat(64),origin:'https://kindelora.pages.dev'};
let calls=[];
try {
 globalThis.fetch=async (url,options)=>{
  calls.push({url,options});
  return new Response(JSON.stringify({id:'test-accepted'}),{status:200,headers:{'content-type':'application/json'}});
 };
 assert.deepEqual(await sendRegistrationVerification(env,params),{accepted:true});
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,'https://api.resend.com/emails');
 const payload=JSON.parse(calls[0].options.body);
 assert.deepEqual(payload.to,[params.email]);
 assert.ok(payload.text.includes('/plus-account.html?verify='));
 assert.ok(!JSON.stringify(payload).includes(env.RESEND_API_KEY));
 for(const override of [{origin:'https://evil.example'},{token:'not-a-token'},{email:'invalid'}]){
  await assert.rejects(sendRegistrationVerification(env,{...params,...override}));
 }
 assert.equal(calls.length,1,'invalid requests must not contact provider');
 for(const status of [400,401,403,422,429,500,503]){
  globalThis.fetch=async()=>new Response(JSON.stringify({message:'synthetic rejection'}),{status});
  await assert.rejects(sendRegistrationVerification(env,params),'Resend HTTP '+status+' must fail closed');
 }
 for(const body of [{}, {id:''}, {id:null}]){
  globalThis.fetch=async()=>new Response(JSON.stringify(body),{status:200});
  await assert.rejects(sendRegistrationVerification(env,params),'provider 2xx without id must not count as acceptance');
 }
 globalThis.fetch=async()=>{throw Error('synthetic network outage')};
 await assert.rejects(sendRegistrationVerification(env,params));
 await assert.rejects(sendRegistrationVerification({...env,RESEND_API_KEY:''},params));
 await assert.rejects(sendRegistrationVerification({...env,PUBLIC_REGISTRATION_ENABLED:'false'},params));
 console.log('PASS: mocked Resend acceptance, input validation, provider failures, missing acknowledgement, network failure and launch gates');
} finally {globalThis.fetch=originalFetch}

import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/member/registration-request.js';
test('missing config emits fixed preflight reason without secret or PII',async()=>{
 const logs=[],prior=console.info;
 console.info=(...a)=>logs.push(a);
 try{
  const request=new Request('https://kindelora.pages.dev/api/member/registration-request',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({email:'private@example.invalid',password:'never-log-this-password'})});
  const response=await onRequestPost({request,env:{PUBLIC_REGISTRATION_ENABLED:'false',RESEND_API_KEY:'re_private_key'}});
  assert.equal(response.status,503);
  assert.deepEqual(logs,[['member_registration_outcome','registration_preflight_unavailable']]);
  assert.doesNotMatch(JSON.stringify(logs),/private@example|never-log-this-password|re_private_key/);
 }finally{console.info=prior}
});

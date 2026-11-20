import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/member/request-password-reset.js';
const make=(origin='https://kindelora.pages.dev')=>new Request('https://kindelora.pages.dev/api/member/request-password-reset',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:'test@example.com'})});
test('recovery endpoint defaults to disabled and never queries DB',async()=>{
 const res=await onRequestPost({request:make(),env:{MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'a'.repeat(40),DB:{prepare(){throw Error('must not touch DB')}}}});
 assert.equal(res.status,503);
});
test('untrusted origin rejected before database use',async()=>{
 const res=await onRequestPost({request:make('https://attacker.example'),env:{MEMBER_PASSWORD_RECOVERY_ENABLED:'true',MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'a'.repeat(40),RESEND_API_KEY:'re_test',REGISTRATION_FROM_EMAIL:'test@example.com',DB:{prepare(){throw Error('must not touch DB')}}}});
 assert.equal(res.status,403);
});
test('malformed email gets generic 202 without database lookup',async()=>{
 const request=new Request('https://kindelora.pages.dev/api/member/request-password-reset',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({email:'not-an-email'})});
 const res=await onRequestPost({request,env:{MEMBER_PASSWORD_RECOVERY_ENABLED:'true',MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'a'.repeat(40),RESEND_API_KEY:'re_test',REGISTRATION_FROM_EMAIL:'test@example.com',DB:{prepare(){throw Error('must not touch DB')}}}});
 assert.equal(res.status,202);assert.match((await res.json()).message,/eligible account/);
});

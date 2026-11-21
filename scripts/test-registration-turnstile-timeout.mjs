import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/member/registration-request.js';
const original=globalThis.fetch;
const req=()=>new Request('https://kindelora.pages.dev/api/member/registration-request',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({email:'test@example.com',password:'valid-password-123',turnstileToken:'test-token'})});
const env={PUBLIC_REGISTRATION_ENABLED:'true',MEMBER_AUTH_ENABLED:'true',DB:{prepare(){throw Error('DB should not be called before challenge succeeds')}},MEMBER_AUTH_PEPPER:'a'.repeat(32),RESEND_API_KEY:'re_test',REGISTRATION_FROM_EMAIL:'KINDELORA <hello@example.com>',TURNSTILE_SECRET_KEY:'test-secret'};
try{
 globalThis.fetch=async(_url,opts)=>{assert.ok(opts.signal);assert.equal(opts.signal.aborted,false);throw new DOMException('Timed out','TimeoutError')};
 let r=await onRequestPost({request:req(),env});assert.equal(r.status,503);assert.equal((await r.json()).error,'Registration temporarily unavailable');
 globalThis.fetch=async(_url,opts)=>{assert.ok(opts.signal);return new Response(JSON.stringify({success:false,hostname:'kindelora.pages.dev'}),{status:200})};
 r=await onRequestPost({request:req(),env});assert.equal(r.status,403);
 globalThis.fetch=async(_url,opts)=>new Response(JSON.stringify({success:true,hostname:'attacker.pages.dev'}),{status:200});
 r=await onRequestPost({request:req(),env});assert.equal(r.status,403);
 console.log('PASS: Turnstile timeout, rejection, hostname mismatch all fail closed before DB');
}finally{globalThis.fetch=original}

import test from 'node:test';
import assert from 'node:assert/strict';
const url='https://kindelora.pages.dev/api/member/registration-config';
test('read-only production registration readiness is safely observable',async()=>{
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),10000);
 try{
  const response=await fetch(url,{headers:{accept:'application/json'},redirect:'error',signal:controller.signal});
  assert.equal(response.status,200,'readiness endpoint returned non-200');
  const body=await response.json();
  assert.equal(typeof body?.available,'boolean');
  assert.ok(Object.keys(body).every(key=>['available','turnstileSiteKey'].includes(key)),'readiness response unexpectedly exposes internal data');
  // Never print the Turnstile key or environment configuration to CI logs.
  console.info('registration_readiness',body.available?'available':'unavailable');
  // Report production readiness as a separate failing gate; never confuse an HTTP 200 with launch readiness.
  assert.equal(body.available,true,'PRODUCTION REGISTRATION NO-GO: configuration or D1 schema unavailable');
 }finally{clearTimeout(timeout)}
});

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
  // A false result is a real NO-GO, but do not fail the CI on pre-existing production state.
 }finally{clearTimeout(timeout)}
});

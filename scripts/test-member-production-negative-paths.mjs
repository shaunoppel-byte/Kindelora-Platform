import test from 'node:test';
import assert from 'node:assert/strict';
const origin='https://kindelora.pages.dev';
async function probe(path,{method='GET',headers={},body}={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),10000);
 try{return await fetch(origin+path,{method,headers,body,signal:controller.signal,redirect:'error'});}
 finally{clearTimeout(timer);}
}
test('production member routes reject unsafe requests without creating accounts',async()=>{
 const ready=await probe('/api/member/registration-config');
 assert.equal(ready.status,200,'readiness endpoint failed');
 const config=await ready.json();
 assert.equal(config.available,true,'registration configuration is not ready');
 // No real email, password, valid Turnstile token, or customer data is ever submitted.
 const invalidOrigin=await probe('/api/member/registration-request',{
  method:'POST',headers:{origin:'https://untrusted.example','content-type':'application/json'},body:'{}'
 });
 assert.equal(invalidOrigin.status,403,'registration origin check must reject foreign origins');
 const malformed=await probe('/api/member/registration-request',{
  method:'POST',headers:{origin,'content-type':'application/json'},body:'{'
 });
 assert.equal(malformed.status,400,'registration must reject malformed JSON');
 const invalidDetails=await probe('/api/member/registration-request',{
  method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:'invalid',password:''})
 });
 assert.equal(invalidDetails.status,400,'registration must reject invalid details before Turnstile');
 const checkout=await probe('/api/plus/checkout');
 assert.equal(checkout.status,503,'checkout must remain disabled until payment E2E approval');
 const payment=await checkout.json();
 assert.equal(payment.error,'checkout_unavailable');
 console.info('PASS: live readiness and negative-path route guards; no customer signup/payment attempted');
});

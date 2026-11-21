import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequest as middleware} from '../functions/_middleware.js';
import {onRequestGet,onRequestPost} from '../functions/api/plus/checkout.js';
const url=(path,method='GET')=>new Request('https://kindelora.pages.dev'+path,{method});
async function run(path,method='GET'){
 let calls=0;
 const response=await middleware({request:url(path,method),next:async()=>{
  calls++;
  return method==='POST'?onRequestPost():onRequestGet();
 }});
 return {response,calls};
}
test('checkout GET and POST reach dedicated handler but always fail closed',async()=>{
 for(const method of ['GET','POST']){
  const {response,calls}=await run('/api/plus/checkout',method);
  assert.equal(calls,1);
  assert.equal(response.status,503);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal((await response.json()).error,'checkout_unavailable');
 }
});
test('protected PLUS paths and unsupported checkout methods cannot bypass guard',async()=>{
 for(const [path,method] of [['/api/plus/checkout','PUT'],['/api/plus/membership','GET'],['/api/plus/checkout/extra','POST']]){
  const {response,calls}=await run(path,method);
  assert.equal(calls,0,path);
  assert.equal(response.status,403,path);
 }
});
test('ambiguous encoded path separators are rejected before routing',async()=>{
 for(const path of ['/api/plus%2fcheckout','/api/plus%252fcheckout','/api/plus%5ccheckout']){
  const {response,calls}=await run(path);
  assert.equal(calls,0);
  assert.equal(response.status,400);
 }
});
test('public readiness never claims payments are enabled',async()=>{
 const {response,calls}=await run('/api/plus/status');
 assert.equal(calls,0);
 assert.equal(response.status,200);
 const body=await response.json();
 assert.equal(body.checkoutAvailable,false);
 assert.equal(body.membershipVerificationAvailable,false);
});

test('encoded checkout spelling normalizes only into disabled handler',async()=>{
 const {response,calls}=await run('/api/plus/%63heckout','POST');
 assert.equal(calls,1);
 assert.equal(response.status,503);
 assert.equal((await response.json()).error,'checkout_unavailable');
});

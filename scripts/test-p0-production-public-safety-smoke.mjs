// Public, read-only live smoke. No credentials, payments, account enumeration or writes.
import assert from 'node:assert/strict';
const base='https://kindelora.pages.dev';
async function get(path){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),12000);
 try{
  return await fetch(base+path,{method:'GET',redirect:'manual',cache:'no-store',signal:controller.signal});
 }finally{clearTimeout(timer);}
}
const readiness=await get('/api/member/login-readiness');
assert.equal(readiness.status,200,'production login readiness endpoint must respond');
assert.match(readiness.headers.get('cache-control')||'',/no-store/i);
const result=await readiness.json();
assert.deepEqual(Object.keys(result).sort(),['available','stage']);
assert.equal(typeof result.available,'boolean');
assert.ok(['ready','configuration','schema','crypto'].includes(result.stage));
assert.equal(result.available,result.stage==='ready');
console.log('Production auth preflight: '+result.stage);
if(!result.available)process.exitCode=1;
const session=await get('/api/member/me');
assert.equal(session.status,401,'unauthenticated session must be rejected');
assert.equal(session.headers.get('set-cookie'),null);
console.log('Production unauthenticated session: rejected (401)');
const checkout=await get('/api/plus/checkout');
assert.equal(checkout.status,503,'production checkout must stay disabled');
assert.match(checkout.headers.get('cache-control')||'',/no-store/i);
const checkoutBody=await checkout.json();
assert.equal(checkoutBody.error,'checkout_unavailable');
assert.equal(checkout.headers.get('set-cookie'),null);
console.log('Production checkout GET: safely disabled (503), no charge attempted');
console.log('PASS: public production preflight and safety guards only; no real member sign-in or PayFast ITN tested');

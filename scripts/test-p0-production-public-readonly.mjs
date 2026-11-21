// Read-only production smoke. No credentials, signup, email, login or payments.
import assert from 'node:assert/strict';
const origin='https://kindelora.pages.dev';
async function get(path){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(origin+path,{method:'GET',redirect:'manual',cache:'no-store',headers:{Accept:'application/json'},signal:controller.signal});
  const body=await response.text();
  let data;try{data=JSON.parse(body)}catch{throw Error(path+' returned non-JSON status '+response.status);}
  assert.match(response.headers.get('cache-control')||'',/no-store/i,path+' cache control');
  console.log(path+' HTTP '+response.status+' (no account data logged)');
  return {status:response.status,data};
 }finally{clearTimeout(timeout);}
}
const config=await get('/api/member/registration-config');
assert.equal(config.status,200,'registration readiness endpoint');
assert.equal(typeof config.data.available,'boolean');
console.log('registration readiness flag: '+(config.data.available?'available':'unavailable'));
const loginReadiness=await get('/api/member/login-readiness');
assert.equal(loginReadiness.status,200,'login readiness endpoint');
assert.equal(typeof loginReadiness.data.available,'boolean');
assert.ok(['ready','configuration','schema','crypto'].includes(loginReadiness.data.stage),'known login readiness stage');
console.log('login readiness: '+loginReadiness.data.stage+' (synthetic only)');
const me=await get('/api/member/me');
assert.equal(me.status,401,'anonymous /me must reject');
assert.equal(me.data.authenticated,false);
const checkout=await get('/api/plus/checkout');
assert.equal(checkout.status,503,'checkout must remain fail-closed');
assert.equal(checkout.data.error,'checkout_unavailable');
console.log('PASS: public readiness, anonymous session rejection and disabled checkout; no E2E login/payment claims');

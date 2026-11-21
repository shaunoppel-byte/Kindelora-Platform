// Read-only public production diagnostic. Never submits credentials or prints secrets.
import assert from 'node:assert/strict';
const url='https://kindelora.pages.dev/api/member/login-readiness';
const controller=new AbortController();
const timer=setTimeout(()=>controller.abort(),12000);
try{
 const r=await fetch(url,{method:'GET',cache:'no-store',redirect:'manual',signal:controller.signal});
 assert.equal(r.status,200,'login readiness endpoint HTTP status');
 assert.match(r.headers.get('cache-control')||'',/no-store/i);
 const data=await r.json();
 assert.equal(typeof data.available,'boolean');
 assert.ok(['configuration','schema','crypto','ready'].includes(data.stage),'known stage only');
 assert.equal(data.available,data.stage==='ready','readiness and stage must agree');
 assert.deepEqual(Object.keys(data).sort(),['available','stage'],'no secret/account fields');
 console.log('Production login readiness: '+data.stage+' (available='+data.available+')');
 if(!data.available)process.exitCode=1;
 else console.log('PASS: production login configuration/schema/crypto preflight only; authenticated login remains unverified');
}finally{clearTimeout(timer);}

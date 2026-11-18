import assert from 'node:assert/strict';
import {generateKeyPairSync,createSign,webcrypto} from 'node:crypto';
import {onRequestGet} from '../functions/api/plus/verify.js';
import {onRequest} from '../functions/_middleware.js';
globalThis.crypto ??= webcrypto;
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'test',alg:'RS256',use:'sig'};
const issuer='https://issuer.example',audience='kindelora-plus';
const b64=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const now=Math.floor(Date.now()/1000);
function token(sub,changes={}) {
 const msg=b64({alg:'RS256',typ:'JWT',kid:'test'})+'.'+b64({iss:issuer,aud:audience,sub,iat:now-5,exp:now+300,...changes});
 const s=createSign('RSA-SHA256');s.update(msg);s.end();return msg+'.'+s.sign(privateKey).toString('base64url');
}
let queries=0;
const env={PLUS_MEMBERSHIP_ENDPOINT_ENABLED:'true',PLUS_AUTH_ISSUER:issuer,
 PLUS_AUTH_AUDIENCE:audience,PLUS_AUTH_TRUSTED_JWKS:JSON.stringify({keys:[jwk]}),
 PLUS_DB:{prepare(){return {bind(subject){queries++;return {async first(){return {entitled:subject==='alice'?1:0};}};}};}}};
const request=t=>new Request('https://kindelora.example/api/plus/verify',{headers:t?{Authorization:'Bearer '+t}:{}});
const run=async(e,t)=>onRequestGet({env:e,request:request(t)});
let res=await run({...env,PLUS_MEMBERSHIP_ENDPOINT_ENABLED:'false'},token('alice'));
assert.equal(res.status,403);assert.equal(queries,0);
res=await run(env,null);assert.equal(res.status,401);assert.equal(queries,0);
res=await run(env,token('alice'));assert.equal(res.status,200);
assert.deepEqual(await res.json(),{entitled:true});
assert.equal(res.headers.get('Cache-Control'),'no-store, private');
res=await run(env,token('bob'));assert.equal(res.status,403);
const before=queries;
for(const t of [token('alice',{exp:now-1}),token('alice',{iss:'evil'}),'forged']) {
 res=await run(env,t);assert.equal(res.status,401);
}
assert.equal(queries,before,'invalid auth must never query D1');
res=await run({...env,PLUS_AUTH_TRUSTED_JWKS:'bad'},token('alice'));
assert.equal(res.status,503);
res=await run({...env,PLUS_DB:null},token('alice'));assert.equal(res.status,503);
res=await run({...env,PLUS_DB:{prepare(){throw Error('db down')}}},token('alice'));assert.equal(res.status,403);
let forwarded=false;
const middleware=await onRequest({request:request(token('alice')),next(){forwarded=true;return new Response('leak')}});
assert.equal(middleware.status,403);
assert.equal(forwarded,false,'global middleware must deny even if endpoint is implemented');
console.log('PASS: PLUS endpoint remains middleware-blocked and fails closed on auth, config and DB errors');

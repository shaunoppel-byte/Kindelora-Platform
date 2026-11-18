import assert from 'node:assert/strict';
import {generateKeyPairSync,createSign,webcrypto} from 'node:crypto';
import {authorizePlusMembership} from '../functions/_lib/plus-authorization.js';
globalThis.crypto ??= webcrypto;
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'local-test-key',alg:'RS256',use:'sig'};
const issuer='https://auth.example',audience='kindelora-plus',nowSeconds=1800000000;
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function token(subject,overrides={}) {
 const header=b64({alg:'RS256',typ:'JWT',kid:'local-test-key'});
 const claims=b64({sub:subject,iss:issuer,aud:audience,iat:nowSeconds-20,exp:nowSeconds+300,...overrides});
 const data=header+'.'+claims;const signer=createSign('RSA-SHA256');signer.update(data);signer.end();
 return data+'.'+signer.sign(privateKey).toString('base64url');
}
const expectedNow=new Date(nowSeconds*1000).toISOString();
let queries=0;
const db={prepare(sql) {
 assert.match(sql,/JOIN plus_customers c/);
 return {bind(subject,time) {
   queries++;assert.equal(time,expectedNow);
   return {async first(){return {entitled:subject==='alice' ? 1 : 0};}};
 }};
}};
const base={issuer,audience,trustedKeys:[jwk],db,nowSeconds};
assert.deepEqual(await authorizePlusMembership({...base,token:token('alice')}),{entitled:true,reason:'active'});
assert.deepEqual(await authorizePlusMembership({...base,token:token('bob')}),{entitled:false,reason:'not_entitled'});
const before=queries;
for(const bad of [
 undefined,'junk',token('alice',{exp:nowSeconds}),token('alice',{iss:'https://attacker.example'}),
 token('alice',{aud:'other'}),token('alice',{nbf:nowSeconds+500})
]) {
 const result=await authorizePlusMembership({...base,token:bad,verifiedIdentitySubject:'alice'});
 assert.deepEqual(result,{entitled:false,reason:'unauthenticated'});
}
assert.equal(queries,before,'unverified tokens must never access D1');
assert.deepEqual(await authorizePlusMembership({...base,token:token('alice'),db:null}),{entitled:false,reason:'unavailable'});
assert.deepEqual(await authorizePlusMembership({...base,token:token('alice'),db:{prepare(){throw Error('offline')}}}),{entitled:false,reason:'unavailable'});
console.log('PASS: signed identity + D1 entitlement compose securely and fail closed without a live route');

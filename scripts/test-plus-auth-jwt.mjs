import assert from 'node:assert/strict';
import {generateKeyPairSync,createSign,webcrypto} from 'node:crypto';
import {verifyTrustedJwtIdentity} from '../functions/_lib/plus-auth-jwt.js';
globalThis.crypto ??= webcrypto;
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'test-key',alg:'RS256',use:'sig'};
const issuer='https://trusted-issuer.example',audience='kindelora-plus',nowSeconds=1800000000;
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function sign(claims,header={alg:'RS256',typ:'JWT',kid:'test-key'}) {
 const input=b64(header)+'.'+b64(claims);
 const signer=createSign('RSA-SHA256');signer.update(input);signer.end();
 return input+'.'+signer.sign(privateKey).toString('base64url');
}
const claims={sub:'server-verified-subject',iss:issuer,aud:audience,iat:nowSeconds-10,exp:nowSeconds+300};
const base={issuer,audience,trustedKeys:[jwk],nowSeconds};
const good=sign(claims);
assert.equal(await verifyTrustedJwtIdentity({...base,token:good}),claims.sub);
for(const token of [
 sign({...claims,exp:nowSeconds}),sign({...claims,iss:'https://evil.example'}),
 sign({...claims,aud:'other'}),sign({...claims,nbf:nowSeconds+100}),
 sign({...claims,iat:nowSeconds+100}),sign({...claims,sub:''}),
 sign(claims,{alg:'HS256',typ:'JWT',kid:'test-key'}),
 sign(claims,{alg:'none',typ:'JWT',kid:'test-key'}),
 sign(claims,{alg:'RS256',typ:'JWT',kid:'unknown'}),
 good.slice(0,good.lastIndexOf('.')+1)+(good[good.lastIndexOf('.')+1]==='A'?'B':'A')+good.slice(good.lastIndexOf('.')+2),'not-a-jwt'
]) assert.equal(await verifyTrustedJwtIdentity({...base,token}),null);
assert.equal(await verifyTrustedJwtIdentity({...base,token:good,trustedKeys:[]}),null);
assert.equal(await verifyTrustedJwtIdentity({...base,token:good,audience:'wrong'}),null);
console.log('PASS: trusted JWT identity requires valid RS256 signature, issuer, audience, time and pinned key');

// Offline integration contract: registration -> login -> checkout -> entitlement.
// These assertions deliberately fail closed until real email verification, D1,
// PayFast ITN and subscription issuance are deployed and tested.
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost as register} from '../functions/api/member/register.js';
import {onRequestPost as login} from '../functions/api/member/login.js';
import {onRequestGet as me} from '../functions/api/member/me.js';
import {onRequestGet as entitlement} from '../functions/api/member/entitlement.js';
import {onRequestPost as checkout} from '../functions/api/plus/checkout.js';
import {onRequestGet as subscription} from '../functions/api/plus/subscription.js';
import {onRequest as middleware} from '../functions/_middleware.js';
if (!globalThis.crypto) globalThis.crypto=webcrypto;
const base='https://kindelora.pages.dev';
const jsonPost=(path,body)=>new Request(base+path,{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify(body)});
const unconfigured={MEMBER_AUTH_ENABLED:'false'};
const email='customer@example.test',password='test-password-very-long';
const registration=await register({request:jsonPost('/api/member/register',{email,password}),env:unconfigured});
assert.equal(registration.status,503,'registration must not claim success without configured identity');
const signedIn=await login({request:jsonPost('/api/member/login',{email,password}),env:unconfigured});
assert.equal(signedIn.status,503,'login must not create a session without identity backend');
const account=await me({request:new Request(base+'/api/member/me'),env:unconfigured});
assert.equal(account.status,503);
const access=await entitlement({request:new Request(base+'/api/member/entitlement'),env:unconfigured});
assert.equal(access.status,503,'unconfigured backend must not grant PLUS');
for(const body of [{plan:'monthly'},{plan:'annual'},{plan:'monthly',amount:0,currency:'ZAR'}]){
 const response=await checkout({request:jsonPost('/api/plus/checkout',body),env:unconfigured});
 assert.equal(response.status,503,'no checkout may accept an unverified order');
 assert.doesNotMatch(JSON.stringify(await response.json()),/payment_url|checkout_url|token|signature/i);
}
assert.equal((await subscription({request:new Request(base+'/api/plus/subscription'),env:unconfigured})).status,503);
let nextCalled=false;
for(const path of ['/api/plus/checkout','/api/plus/subscription','/premium','/members']){
 const response=await middleware({request:new Request(base+path),next:()=>{nextCalled=true;return new Response('bypass')}});
 assert.equal(response.status,403,'protected route must be blocked: '+path);
}
assert.equal(nextCalled,false,'protected routes must not reach static assets');
const readiness=await middleware({request:new Request(base+'/api/plus/status'),next:()=>{throw Error('readiness must be handled by guard')}});
assert.equal(readiness.status,200);
const status=await readiness.json();
assert.equal(status.checkoutAvailable,false);
assert.equal(status.membershipVerificationAvailable,false);
console.log('PASS: registration, login, account, entitlement, checkout, subscription and protected routing all fail closed before verified integration');

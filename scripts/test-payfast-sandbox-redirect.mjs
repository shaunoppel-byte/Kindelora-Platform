import assert from 'node:assert/strict';
import {buildPayFastSandboxRedirect as build} from '../functions/_lib/payfast-sandbox-redirect.js';
const order={environment:'sandbox',status:'pending',plan:'monthly',usdMinor:899,zarMinor:17000,settlementCurrency:'ZAR',reference:'order_12345678',quoteExpiresAtMs:Date.now()+600000};
const config={merchantId:'10000100',merchantKey:'testmerchantkey',passphrase:'test-secret',returnUrl:'https://kindelora.pages.dev/plus/success',cancelUrl:'https://kindelora.pages.dev/plus/cancel',notifyUrl:'https://kindelora.pages.dev/api/plus/payfast-itn'};
const good=build({order,...config});
assert.equal(good.ok,true);assert.equal(good.action,'https://sandbox.payfast.co.za/eng/process');assert.equal(good.fields.amount,'170.00');assert.match(good.fields.signature,/^[a-f0-9]{32}$/);
assert.equal(Object.hasOwn(good.fields,'passphrase'),false);
for(const bad of [{order:{...order,zarMinor:0}},{order:{...order,usdMinor:900}},{order:{...order,environment:'live'}},{order:{...order,quoteExpiresAtMs:1}},{merchantId:''},{passphrase:''},{notifyUrl:'https://evil.example/api'},{notifyUrl:'https://attacker.pages.dev/api/plus/payfast-itn'}]){
 const v=build({order,...config,...bad});assert.equal(v.ok,false);assert.equal(v.authorizesPayment,false);
}
console.log('PASS: sandbox-only signed PayFast redirect contract and fail-closed tests');

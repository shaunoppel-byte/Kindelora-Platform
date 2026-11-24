import assert from 'node:assert/strict';
import {buildPayFastLiveRedirect as build} from '../functions/_lib/payfast-live-redirect.js';
import {signPayfastForm} from '../functions/_lib/payfast-form-signature.mjs';
const nowMs=Date.parse('2026-11-22T10:00:00Z');
const order={environment:'live',status:'pending',plan:'monthly',usdMinor:899,zarMinor:16500,settlementCurrency:'ZAR',reference:'kin_live_12345678',quoteExpiresAtMs:nowMs+600000};
const merchant={merchantId:'10000100',merchantKey:'merchant_key_12345',passphrase:'secret_passphrase',returnUrl:'https://kindelora.pages.dev/plus-account.html?payment=live-return',cancelUrl:'https://kindelora.pages.dev/plus-account.html?payment=live-cancel',notifyUrl:'https://kindelora.pages.dev/api/plus/payfast-live-itn'};
const args={order,...merchant,recurringApproved:true,nowMs};
let r=build(args);assert.equal(r.ok,true);assert.equal(r.action,'https://www.payfast.co.za/eng/process');assert.equal(r.fields.amount,'165.00');assert.equal(r.fields.frequency,'3');assert.equal(r.fields.recurring_amount,'165.00');assert.match(r.fields.signature,/^[a-f0-9]{32}$/);assert.equal(r.authorizesPayment,false);
assert.deepEqual(Object.keys(r.fields).slice(-5),['subscription_type','recurring_amount','frequency','cycles','signature']);
assert.equal(r.fields.signature,signPayfastForm(Object.fromEntries(Object.entries(r.fields).filter(([key])=>key!=='signature')),args.passphrase));
r=build({...args,order:{...order,plan:'annual',usdMinor:8999}});assert.equal(r.ok,true);assert.equal(r.fields.frequency,'6');
for(const invalid of [
 {recurringApproved:false},
 {order:{...order,environment:'sandbox'}},{order:{...order,status:'paid'}},{order:{...order,usdMinor:900}},
 {order:{...order,quoteExpiresAtMs:nowMs}},{order:{...order,zarMinor:499}},
 {notifyUrl:'https://kindelora.pages.dev/api/plus/payfast-itn'},
 {notifyUrl:'https://kindelora.pages.dev/api/plus/payfast-live-itn?test=1'},
 {merchantId:'bad'},{passphrase:''},{notifyUrl:'https://evil.example/api/plus/live-itn'},
 {returnUrl:'http://kindelora.pages.dev/plus-account.html'},
 {returnUrl:'https://kindelora.pages.dev/admin?payment=live-return'},
 {returnUrl:'https://kindelora.pages.dev/plus-account.html?payment=live-return&next=evil'},
 {cancelUrl:'https://kindelora.pages.dev/plus-account.html?payment=live-return'},
]){r=build({...args,...invalid});assert.equal(r.ok,false);assert.equal(r.authorizesPayment,false)}
console.log('PASS: production PayFast redirect contract enforces trusted live orders and recurring fields');

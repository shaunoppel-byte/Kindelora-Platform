#!/usr/bin/env node
// Contract for real KINDELORA member UI. Never interpret simulated billing as payment.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('plus-account.html'),js=read('plus-account.js'),middleware=read('functions/_middleware.js');
for(const id of ['login','register','login-email','login-password','register-email','register-password','account-state','entitlement-state','logout','status'])assert.match(html,new RegExp('id="'+id+'"'),'missing account UI element: '+id);
for(const endpoint of ['/api/member/login','/api/member/me','/api/member/entitlement','/api/member/logout'])assert.ok(js.includes(endpoint),'missing real endpoint '+endpoint);
assert.match(html,/\$8\.99 USD/);assert.match(html,/\$89\.99 USD/);
assert.doesNotMatch(html,/Invitation code|invitation-only|Create invited account/i);
assert.match(html,/Checking availability…/);
assert.match(html,/id="registration-turnstile"/);
assert.match(html,/id="registration-submit"/);
assert.match(js,/\/api\/member\/registration-config/);
assert.match(js,/\/api\/member\/registration-request/);
assert.match(html,/email verification/i);
assert.match(html,/<button id="registration-submit" type="submit" disabled title="Checking secure registration availability">Checking availability…<\/button>/);
assert.doesNotMatch(js,/\/api\/member\/register/);
assert.match(html,/Secure checkout checks payment availability before you continue/,'UI must disclose guarded checkout availability');
assert.match(html,/Payment availability is checked securely before any handoff to PayFast/,'guarded checkout must explain payment availability');
assert.equal((html.match(/href="\/plus-checkout\.html"/g)||[]).length,3,'all three PLUS entry links must lead to guarded customer checkout');
assert.doesNotMatch(html,/href="\/checkout-preview\.html"/,'member account must not send customers to old preview');
assert.doesNotMatch(html,/<form[^>]+action=["']https?:\/\//i,'no external payment submission from account UI');
assert.doesNotMatch(js,/localStorage|sessionStorage|payment_url|checkout_url|window\.location\s*=/i,'UI must not grant PLUS or fake payment navigation');
assert.match(js,/e\.data\.plus===true/,'PLUS status must depend on server entitlement');
const endpoint=read('functions/api/member/entitlement.js');
assert.match(endpoint,/plus:verified\.entitled/,'UI and backend PLUS response contract must agree');
assert.match(middleware,/checkoutAvailable:\s*false/,'payment release guard must remain closed');
console.log('PASS: account UI preserves registration verification and routes to guarded checkout with charging disabled');

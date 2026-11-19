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
assert.match(html,/Public registration coming soon/);
assert.match(html,/email verification/i);
assert.match(html,/<button type="submit" disabled title="Email verification is being configured">Public registration coming soon<\/button>/);
assert.doesNotMatch(js,/\/api\/member\/register/);
assert.match(html,/Checkout coming soon/);
assert.equal((html.match(/disabled>Checkout coming soon<\/button>/g)||[]).length,2,'both checkout buttons must be disabled');
assert.doesNotMatch(js,/localStorage|sessionStorage|payment_url|checkout_url|window\.location\s*=/i,'UI must not grant PLUS or fake payment navigation');
assert.match(js,/e\.data\.plus===true/,'PLUS status must depend on server entitlement');
const endpoint=read('functions/api/member/entitlement.js');
assert.match(endpoint,/plus:verified\.entitled/,'UI and backend PLUS response contract must agree');
assert.match(middleware,/checkoutAvailable:\s*false/,'payment release guard must remain closed');
console.log('PASS: account UI keeps unverified public registration and payments disabled');

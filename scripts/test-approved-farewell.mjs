import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('member-farewell.html','utf8');
const js=readFileSync('member-farewell.js','utf8');
const welcome=readFileSync('member-welcome.js','utf8');
// Current founder-directed farewell is a text-based, accessible card rather than the
// superseded image-only version. Verify its human-centred, privacy-safe contract.
assert.ok(html.includes('class="farewell-card"'),'Farewell card must be present');
assert.ok(html.includes('id="farewell-title"'),'Farewell heading must be accessible');
assert.ok(html.includes('Until next time'),'Farewell copy must remain warm and human');
assert.ok(html.includes('There is always a place for you here'),'Retain never-alone promise');
assert.ok(html.includes('href="/plus-account.html#login"'),'Provide a way to sign in again');
assert.ok(html.includes('href="/"'),'Provide a way home');
assert.ok(!html.includes('Goodbye, Shaun'),'Do not hardcode a member identity');
assert.ok(!js.includes('email.split'),'Do not infer a name from email');
assert.ok(js.includes('name.textContent'),'Dynamic member names must use textContent');
assert.ok(html.includes('id="signout-state"')&&html.includes('id="retry"'),'Keep signout feedback and retry');
assert.ok(js.includes("fetch('/api/member/logout'"),'Farewell must revoke session');
assert.ok(js.includes("verify.status!==401"),'Farewell must verify signed-out state');
assert.ok(js.includes("retry.addEventListener('click',finish)"),'Failure must offer retry');
assert.ok(welcome.includes("location.assign('/member-farewell.html')"),'Signout button must navigate to farewell');
console.log('PASS: accessible farewell card, privacy-safe naming, session-revocation path, retry');

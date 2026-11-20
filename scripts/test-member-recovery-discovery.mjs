import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../plus-account.html',import.meta.url),'utf8');
test('login exposes recovery entry without changing registration block',()=>{
 const login=html.split('<form id="login">')[1]?.split('</form>')[0];
 const registration=html.split('<form id="register">')[1]?.split('</form>')[0];
 assert.ok(login&&registration);
 assert.match(login,/<a href="\/recover-account\.html">Forgot your password\?<\/a>/);
 assert.doesNotMatch(registration,/recover-account\.html/);
 assert.match(registration,/id="registration-turnstile"/);
 assert.match(registration,/id="registration-submit"/);
});

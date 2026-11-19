import assert from 'node:assert/strict';
import {cookie,clearCookie,tokenFrom} from '../functions/api/member/_auth.js';
const token='a'.repeat(64);
for(const value of [cookie(token),clearCookie]){
 assert.match(value,/; Path=\/api;/,'session must be available to member and future checkout API routes');
 assert.match(value,/; Secure;/);
 assert.match(value,/; HttpOnly;/);
 assert.match(value,/; SameSite=Strict;/);
 assert.doesNotMatch(value,/; Domain=/,'host-only cookies must not leak across company domains');
}
assert.match(cookie(token),/Max-Age=604800/);
assert.match(clearCookie,/Max-Age=0/);
assert.equal(tokenFrom(new Request('https://kindelora.pages.dev/api/plus/checkout',{headers:{cookie:'kindelora_session='+token}})),token);
assert.equal(tokenFrom(new Request('https://kindelora.pages.dev/api/member/me',{headers:{cookie:'kindelora_session='+token}})),token);
console.log('PASS: same host-only secure member session is available to membership and future checkout APIs, and logout clears the same cookie path');

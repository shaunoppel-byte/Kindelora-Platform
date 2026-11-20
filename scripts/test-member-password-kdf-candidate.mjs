// Offline candidate verification; does not establish Cloudflare workerd compatibility.
import assert from 'node:assert/strict';
const {newPasswordSalt,derivePassword}=await import('../functions/_lib/member-password-kdf-candidate.js');
const salt=newPasswordSalt();
assert.match(salt,/^v2:[a-f0-9]{64}$/);
const first=await derivePassword('a long unique test password',salt);
assert.match(first,/^[a-f0-9]{64}$/);
assert.equal(first,await derivePassword('a long unique test password',salt));
assert.notEqual(first,await derivePassword('a different test password',salt));
assert.notEqual(first,await derivePassword('a long unique test password',newPasswordSalt()));
await assert.rejects(()=>derivePassword('password','invalid-legacy-salt'),/Legacy/);
await assert.rejects(()=>derivePassword('password','v2:invalid'),/Invalid password salt/);
console.log('Candidate KDF deterministic and domain-separated offline tests passed; runtime and security review pending.');

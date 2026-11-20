import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('registration never bypasses Turnstile on provider/network errors',async()=>{
 const src=await readFile('functions/api/member/registration-request.js','utf8');
 assert.match(src,/try \{challengePassed=await turnstile\(env,data\.turnstileToken,ip\);\} catch/);
 assert.match(src,/audit\('turnstile_provider_unavailable'\)/);
 assert.match(src,/if\(!challengePassed\)return reply\(\{error:'Security challenge failed'\},403\)/);
 assert.match(src,/audit\('rate_limit_key_unavailable'\)/);
 assert.doesNotMatch(src,/console\.(?:error|warn)\(/);
});

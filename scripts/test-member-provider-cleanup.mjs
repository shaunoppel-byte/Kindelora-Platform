import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('failed email provider cleanup never masks the provider 503 or leaks sensitive data',async()=>{
 const src=await readFile('functions/api/member/registration-request.js','utf8');
 const block=src.slice(src.indexOf("audit('provider_delivery_failed')"),src.indexOf("audit('provider_accepted')"));
 assert.match(block,/try\s*\{[\s\S]*?DELETE FROM member_email_verifications[\s\S]*?\}\s*catch\s*\{/);
 assert.match(block,/audit\('provider_failure_cleanup_failed'\)/);
 assert.match(block,/return reply\(\{error:'Verification email delivery is temporarily unavailable'\},503\)/);
 assert.doesNotMatch(block,/console\.(?:error|warn)|throw\s/);
});

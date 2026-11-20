import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('registration isolates hash conversion failures without logging secrets',async()=>{
 const src=await readFile('functions/api/member/registration-request.js','utf8');
 const start=src.indexOf('let passwordHash;');
 const end=src.indexOf("audit('password_hash_completed');",start);
 assert.ok(start>0&&end>start);
 const block=src.slice(start,end);
 assert.match(block,/new Uint8Array\(derived\)/);
 assert.match(block,/\^\[a-f0-9\]\{64\}\$/);
 assert.match(block,/audit\('password_hash_encoding_failed'\)/);
 assert.doesNotMatch(block,/console\.(?:error|warn|log)/);
 assert.match(block,/return reply\(\{error:'Registration temporarily unavailable'\},503\)/);
});

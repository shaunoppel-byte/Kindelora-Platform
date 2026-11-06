'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
test('private artwork routes fail closed for guests and unpaid members',()=>{
 const route=fs.readFileSync(path.join(root,'functions/api/member/affirmation-artwork/[id].js'),'utf8');
 const library=fs.readFileSync(path.join(root,'functions/api/member/affirmation-library.js'),'utf8');
 for(const code of [route,library]){
  assert.ok(code.includes('if(!ready(env))'));
  assert.ok(code.includes('if(!user)'));
  assert.ok(code.includes('if(!row)'));
  assert.ok(code.includes("s.status='active'"));
  assert.ok(code.includes('email_verified_at IS NOT NULL'));
 }
 assert.ok(route.includes('PRIVATE_AFFIRMATION_ARTWORK.get'));
 assert.ok(route.includes('private, no-store'));
 assert.ok(library.includes('PRIVATE_AFFIRMATION_ARTWORK.head'));
 assert.ok(library.includes('checks.some'));
});

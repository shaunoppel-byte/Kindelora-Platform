// Security regression: registration and login must share the exact v2 password contract.
// This test uses synthetic credentials only; never read production secrets or D1 records.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
const enc=new TextEncoder();
const hex=bits=>Buffer.from(bits).toString('hex');
async function registrationHash(password,salt,pepper){
 const key=await webcrypto.subtle.importKey('raw',enc.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const material=await webcrypto.subtle.sign('HMAC',key,enc.encode(password));
 const pbkdf=await webcrypto.subtle.importKey('raw',material,'PBKDF2',false,['deriveBits']);
 return hex(await webcrypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},pbkdf,256));
}
async function loginHash(password,salt,pepper){
 const pepperKey=await webcrypto.subtle.importKey('raw',enc.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const peppered=await webcrypto.subtle.sign('HMAC',pepperKey,enc.encode(password));
 const key=await webcrypto.subtle.importKey('raw',peppered,'PBKDF2',false,['deriveBits']);
 return hex(await webcrypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},key,256));
}
test('v2 registration and login derive identical hashes; wrong password and changed pepper fail',async()=>{
 const password='synthetic-only-passphrase-123',salt='v2:'+'a'.repeat(64),pepper='test-pepper-do-not-use-in-production-'.repeat(2);
 const expected=await registrationHash(password,salt,pepper);
 assert.match(expected,/^[a-f0-9]{64}$/);
 assert.equal(await loginHash(password,salt,pepper),expected);
 assert.notEqual(await loginHash(password+'x',salt,pepper),expected);
 assert.notEqual(await loginHash(password,salt,pepper+'changed'),expected);
});
test('production source maintains the same v2 HMAC PBKDF2 contract and verification copies the hash',async()=>{
 const [registration,login,verify]=await Promise.all(['functions/api/member/registration-request.js','functions/api/member/login.js','functions/api/member/verify-email.js'].map(p=>readFile(p,'utf8')));
 for(const src of [registration,login]){
  assert.match(src,/iterations:100000/);
  assert.match(src,/hash:\s*['\"]SHA-256['\"]/);
  assert.match(src,/HMAC/);
  assert.match(src,/PBKDF2/);
  assert.match(src,/MEMBER_AUTH_PEPPER/);
 }
 assert.match(registration,/salt='v2:'\+random\(\)/);
 assert.match(verify,/v\.password_salt,v\.password_hash/);
 assert.match(login,/same\(candidate,user\.password_hash\)/);
});

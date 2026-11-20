import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto, pbkdf2Sync} from 'node:crypto';
// Reproduces the existing registration, invitation and login PBKDF2 parameters.
// A failure here does NOT diagnose Cloudflare workerd production CPU limits.
const encoder=new TextEncoder();
const derive=async(password,salt)=>{
 const key=await webcrypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await webcrypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:310000,hash:'SHA-256'},key,256);
 return Buffer.from(bits).toString('hex');
};
test('310k PBKDF2 SHA256 WebCrypto matches independent Node reference',async()=>{
 for(const [password,salt] of [['correct horse battery staple','a'.repeat(64)],['long passphrase é ☀','f'.repeat(64)]]){
  const expected=pbkdf2Sync(password,Buffer.from(salt,'utf8'),310000,32,'sha256').toString('hex');
  assert.equal(await derive(password,salt),expected);
  assert.equal(expected.length,64);
  assert.notEqual(await derive(password+'x',salt),expected);
 }
});
test('registration and login continue to use identical PBKDF2 contract',async()=>{
 const fs=await import('node:fs/promises');
 for(const path of ['functions/api/member/registration-request.js','functions/api/member/register.js','functions/api/member/login.js']){
  const src=await fs.readFile(path,'utf8');
  assert.match(src,/iterations:310000/);
  assert.match(src,/PBKDF2/);
  assert.match(src,/SHA-256/);
  assert.match(src,/encoder\.encode\(salt\)|new TextEncoder\(\)\.encode\(salt\)/);
 }
});

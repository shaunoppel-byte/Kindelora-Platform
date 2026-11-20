import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {newRecoveryToken,recoveryTokenHash,newRecoveryPasswordHash} from '../functions/_lib/member-password-recovery.js';
import {verificationTokenHash} from '../functions/_lib/member-email-verification.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const enc=new TextEncoder(),pepper='synthetic-recovery-test-pepper-1234567890';
async function loginHash(password,salt){
 const key=await crypto.subtle.importKey('raw',enc.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const material=await crypto.subtle.sign('HMAC',key,enc.encode(password));
 const pbkdf=await crypto.subtle.importKey('raw',material,'PBKDF2',false,['deriveBits']);
 return Buffer.from(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},pbkdf,256)).toString('hex');
}
test('recovery tokens are random, 256-bit hex and purpose-scoped',async()=>{
 const a=newRecoveryToken(),b=newRecoveryToken();
 assert.match(a,/^[a-f0-9]{64}$/);assert.notEqual(a,b);
 const recovery=await recoveryTokenHash(a,pepper);
 assert.match(recovery,/^[a-f0-9]{64}$/);
 assert.notEqual(recovery,await verificationTokenHash(a,pepper));
 assert.notEqual(recovery,await recoveryTokenHash(a,pepper+'changed'));
});
test('invalid tokens and unconfigured secrets fail closed',async()=>{
 await assert.rejects(recoveryTokenHash('invalid',pepper));
 await assert.rejects(recoveryTokenHash('a'.repeat(64),'short'));
 await assert.rejects(newRecoveryPasswordHash('too-short',pepper));
 await assert.rejects(newRecoveryPasswordHash('valid-password-123','short'));
});
test('new recovery password is exactly compatible with production V2 login',async()=>{
 const password='synthetic-new-password-123',first=await newRecoveryPasswordHash(password,pepper),second=await newRecoveryPasswordHash(password,pepper);
 assert.match(first.salt,/^v2:[a-f0-9]{64}$/);
 assert.match(first.passwordHash,/^[a-f0-9]{64}$/);
 assert.equal(first.passwordHash,await loginHash(password,first.salt));
 assert.notEqual(first.salt,second.salt);assert.notEqual(first.passwordHash,second.passwordHash);
});

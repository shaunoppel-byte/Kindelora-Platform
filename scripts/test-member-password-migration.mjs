// Run: node --test scripts/test-member-password-migration.mjs
// Regression checks for the historical registration hash and the new login hash.
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
const {subtle}=webcrypto, enc=new TextEncoder();
async function pbkdf(input,salt,iterations){
 const key=await subtle.importKey('raw',input,'PBKDF2',false,['deriveBits']);
 return Buffer.from(await subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations,hash:'SHA-256'},key,256)).toString('hex');
}
async function legacy(password,salt){return pbkdf(enc.encode(password),salt,310000);}
async function modern(password,salt,pepper){
 const key=await subtle.importKey('raw',enc.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const pre=await subtle.sign('HMAC',key,enc.encode(password));
 return pbkdf(pre,salt,100000);
}
test('legacy registration hash is incompatible with v2 login hash',async()=>{
 const password='correct-horse-long-pass',salt='a'.repeat(64),pepper='p'.repeat(64);
 const old=await legacy(password,salt);
 const newHash=await modern(password,'v2:'+salt,pepper);
 assert.notEqual(old,newHash);
 assert.equal(old,await legacy(password,salt));
});
test('v2 migration retains password validation and rejects incorrect password',async()=>{
 const password='correct-horse-long-pass',salt='v2:'+'b'.repeat(64),pepper='p'.repeat(64);
 const migrated=await modern(password,salt,pepper);
 assert.equal(migrated,await modern(password,salt,pepper));
 assert.notEqual(migrated,await modern('incorrect-horse-long-pass',salt,pepper));
});
test('unique salts produce different password hashes',async()=>{
 const pepper='p'.repeat(64);
 assert.notEqual(await modern('correct-horse-long-pass','v2:'+'c'.repeat(64),pepper),await modern('correct-horse-long-pass','v2:'+'d'.repeat(64),pepper));
});

// Offline integration test of actual member login handler. Synthetic account only.
// No production credentials, email, database, network or registration writes.
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/member/login.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const pepper='test-pepper-not-production-0123456789abcdef';
const email='synthetic-login@example.invalid',password='synthetic-test-password';
const salt='v2:synthetic-salt-0123456789';
const enc=new TextEncoder();
const pepperKey=await crypto.subtle.importKey('raw',enc.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
const peppered=await crypto.subtle.sign('HMAC',pepperKey,enc.encode(password));
const key=await crypto.subtle.importKey('raw',peppered,'PBKDF2',false,['deriveBits']);
const hash=Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},key,256)),x=>x.toString(16).padStart(2,'0')).join('');
let sessions=0,limitWrites=0,accountPresent=true,locked=false;
const user={id:'synthetic-member',email_normalized:email,password_salt:salt,password_hash:hash,
 email_verified_at:'2026-11-20T00:00:00Z',disabled_at:null};
const db={prepare(sql){return {bind(...args){return {
 async first(){
  if(sql.includes('FROM member_login_limits'))return locked?{failures:5,locked_until:'2999-01-01T00:00:00Z'}:null;
  if(sql.includes('FROM members'))return accountPresent?user:null;
  throw Error('unexpected select');
 },
 async run(){
  if(sql.includes('INSERT INTO member_sessions')){sessions++;return {meta:{changes:1}}}
  if(sql.includes('INSERT INTO member_login_limits')){limitWrites++;return {meta:{changes:1}}}
  if(sql.includes('DELETE FROM member_login_limits'))return {meta:{changes:1}};
  throw Error('unexpected write');
 }};}}}};
const env={MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper,DB:db};
async function login(pass=password,origin='https://kindelora.pages.dev'){
 const request=new Request('https://kindelora.pages.dev/api/member/login',{method:'POST',
  headers:{origin,'content-type':'application/json'},body:JSON.stringify({email,password:pass})});
 return onRequestPost({request,env});
}
const success=await login();
assert.equal(success.status,200);
assert.equal((await success.json()).authenticated,true);
assert.match(success.headers.get('set-cookie'),/^kindelora_session=[a-f0-9]{64};/);
assert.equal(sessions,1);
assert.equal((await login('incorrect')).status,401);
assert.equal(limitWrites,1);
assert.equal(sessions,1);
accountPresent=false;
assert.equal((await login()).status,401);
assert.equal(sessions,1);
accountPresent=true;locked=true;
assert.equal((await login()).status,429);
assert.equal(sessions,1);
locked=false;
assert.equal((await login(password,'https://attacker.invalid')).status,403);
assert.equal(sessions,1);
console.log('PASS: actual v2 member login authenticates synthetic member, issues secure session and rejects wrong/missing/locked/cross-origin requests');

// Synthetic login -> session-cookie -> /me -> logout -> /me roundtrip.
// No production accounts, external calls, or membership entitlements.
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost as login} from '../functions/api/member/login.js';
import {onRequestGet as me} from '../functions/api/member/me.js';
import {onRequestPost as logout} from '../functions/api/member/logout.js';
globalThis.crypto ??= webcrypto;
const origin='https://kindelora.pages.dev',email='roundtrip@example.invalid',password='synthetic-password-123',pepper='x'.repeat(40),salt='v2:roundtrip-test';
const enc=new TextEncoder();
const pepperKey=await crypto.subtle.importKey('raw',enc.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
const peppered=await crypto.subtle.sign('HMAC',pepperKey,enc.encode(password));
const material=await crypto.subtle.importKey('raw',peppered,'PBKDF2',false,['deriveBits']);
const passwordHash=Buffer.from(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},material,256)).toString('hex');
const account={id:'test-member',email_normalized:email,password_salt:salt,password_hash:passwordHash,email_verified_at:'2026-11-20T00:00:00Z',disabled_at:null};
const sessions=new Map();
const db={prepare(sql){return {bind(...args){return {
 async first(){
  if(sql.includes('FROM member_login_limits'))return null;
  if(sql.includes('FROM members WHERE'))return account;
  if(sql.includes('FROM member_sessions s JOIN members m')){
   const session=sessions.get(args[0]);
   return session&&session.expires_at>args[1]?{id:account.id,email_normalized:email,email_verified_at:account.email_verified_at}:null;
  }
  throw Error('Unexpected select '+sql);
 },
 async run(){
  if(sql.startsWith('INSERT INTO member_sessions'))sessions.set(args[0],{expires_at:args[2]});
  else if(sql.startsWith('DELETE FROM member_sessions'))sessions.delete(args[0]);
  else if(!sql.startsWith('DELETE FROM member_login_limits'))throw Error('Unexpected write '+sql);
  return {meta:{changes:1}};
 }
};}}}};
const env={MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper,DB:db};
const make=(path,method='GET',cookie='',body)=>new Request(origin+path,{method,headers:{...(method==='POST'?{origin,'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
const before=await me({request:make('/api/member/me'),env});
assert.equal(before.status,401);
const signedIn=await login({request:make('/api/member/login','POST','',{email,password}),env});
assert.equal(signedIn.status,200);
const setCookie=signedIn.headers.get('set-cookie')||'';
assert.match(setCookie,/Secure; HttpOnly; SameSite=Strict/);
const cookie=setCookie.split(';')[0];
assert.ok(cookie.startsWith('kindelora_session='));
assert.equal(sessions.size,1);
const current=await me({request:make('/api/member/me','GET',cookie),env});
assert.equal(current.status,200);
const currentData=await current.json();
assert.equal(currentData.authenticated,true);
assert.equal(currentData.member.email,email);
const signedOut=await logout({request:make('/api/member/logout','POST',cookie,{}),env});
assert.equal(signedOut.status,200);
assert.match(signedOut.headers.get('set-cookie')||'',/Max-Age=0/);
assert.equal(sessions.size,0);
const after=await me({request:make('/api/member/me','GET',cookie),env});
assert.equal(after.status,401);
console.log('PASS: synthetic login/session-cookie/me/logout/revocation roundtrip (offline only)');

import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/member/login.js';
import {newRecoveryPasswordHash} from '../functions/_lib/member-password-recovery.js';

// Reproduce the real production login handler using real WebCrypto and a narrow
// D1 fixture. Never use real customer credentials or access production D1.
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const pepper='a'.repeat(40),email='synthetic@example.invalid',password='synthetic-only-passphrase-123';
const makeRequest=(p)=>new Request('https://kindelora.pages.dev/api/member/login',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({email,password:p})});
function fakeDB(user){
 const limits=new Map(),sessions=[];
 return {limits,sessions,prepare(sql){
  let args=[];
  return {bind(...x){args=x;return this},async first(){
   if(sql.startsWith('SELECT failures'))return limits.get(args[0])||null;
   if(sql.startsWith('SELECT id,email_normalized'))return args[0]===email?user:null;
   throw Error('unexpected first query');
  },async run(){
   if(sql.startsWith('INSERT INTO member_login_limits')){limits.set(args[0],{failures:args[1],locked_until:args[2]});return {meta:{changes:1}}}
   if(sql.startsWith('DELETE FROM member_login_limits')){limits.delete(args[0]);return {meta:{changes:1}}}
   if(sql.startsWith('INSERT INTO member_sessions')){sessions.push(args);return {meta:{changes:1}}}
   throw Error('unexpected mutation');
  }};
 }};
}
test('verified active V2 member can sign in using real recovery-generated hash',async()=>{
 const {salt,passwordHash}=await newRecoveryPasswordHash(password,pepper);
 const db=fakeDB({id:'synthetic-member',email_normalized:email,password_salt:salt,password_hash:passwordHash,email_verified_at:'2026-11-20T00:00:00Z',disabled_at:null});
 const env={MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper,DB:db};
 const response=await onRequestPost({request:makeRequest(password),env});
 assert.equal(response.status,200);
 assert.equal((await response.json()).authenticated,true);
 assert.match(response.headers.get('set-cookie')||'',/HttpOnly; SameSite=Strict/);
 assert.equal(db.sessions.length,1);
});
test('wrong password gets 401 and never creates a session',async()=>{
 const {salt,passwordHash}=await newRecoveryPasswordHash(password,pepper);
 const db=fakeDB({id:'synthetic-member',email_normalized:email,password_salt:salt,password_hash:passwordHash,email_verified_at:'2026-11-20T00:00:00Z',disabled_at:null});
 const response=await onRequestPost({request:makeRequest('incorrect-password'),env:{MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper,DB:db}});
 assert.equal(response.status,401);
 assert.equal(db.sessions.length,0);
});

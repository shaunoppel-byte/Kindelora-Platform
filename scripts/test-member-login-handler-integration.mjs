// Real login-handler integration tests with synthetic in-memory D1 adapter only.
// No production credentials, customer data or Cloudflare secrets are accessed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/member/login.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const enc=new TextEncoder(),pepper='synthetic-pepper-for-integration-testing-only-123456';
async function v2(password,salt){
 const key=await crypto.subtle.importKey('raw',enc.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signed=await crypto.subtle.sign('HMAC',key,enc.encode(password));
 const pbkdf=await crypto.subtle.importKey('raw',signed,'PBKDF2',false,['deriveBits']);
 return Buffer.from(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},pbkdf,256)).toString('hex');
}
function mockDB(user){
 const limits=new Map(),sessions=[];
 return {limits,sessions,prepare(sql){return {bind(...params){return {
  async first(){if(sql.includes('FROM member_login_limits'))return limits.get(params[0])||null;if(sql.includes('FROM members WHERE'))return user||null;throw Error('Unexpected SELECT: '+sql)},
  async run(){if(sql.startsWith('INSERT INTO member_login_limits')){limits.set(params[0],{failures:params[1],locked_until:params[2]});return {meta:{changes:1}};}if(sql.startsWith('DELETE FROM member_login_limits')){limits.delete(params[0]);return {meta:{changes:1}};}if(sql.startsWith('INSERT INTO member_sessions')){sessions.push(params);return {meta:{changes:1}};}throw Error('Unexpected write: '+sql)}
 };}};}};
}
async function attempt(db,password='synthetic-password-123'){
 const request=new Request('https://kindelora.pages.dev/api/member/login',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({email:'test@example.com',password})});
 return onRequestPost({request,env:{MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper,DB:db}});
}
test('unknown account fails 401, increments counter and issues no session',async()=>{
 const db=mockDB(null),res=await attempt(db);
 assert.equal(res.status,401);assert.equal(db.sessions.length,0);assert.equal([...db.limits.values()][0].failures,1);
});
test('verified V2 account: correct password creates session; wrong password returns 401',async()=>{
 const salt='v2:'+'a'.repeat(64),user={id:'synthetic-id',email_normalized:'test@example.com',password_salt:salt,password_hash:await v2('synthetic-password-123',salt),email_verified_at:'2026-11-20T00:00:00.000Z',disabled_at:null};
 const db=mockDB(user),bad=await attempt(db,'wrong-password');assert.equal(bad.status,401);assert.equal(db.sessions.length,0);
 const good=await attempt(db);assert.equal(good.status,200);assert.equal(db.sessions.length,1);assert.equal(db.limits.size,0);
});
test('unverified or disabled V2 account cannot sign in with correct password',async()=>{
 const salt='v2:'+'b'.repeat(64),password_hash=await v2('synthetic-password-123',salt);
 for(const changes of [{email_verified_at:null,disabled_at:null},{email_verified_at:'2026-11-20T00:00:00.000Z',disabled_at:'2026-11-20T00:00:00.000Z'}]){
  const db=mockDB({id:'synthetic-id',email_normalized:'test@example.com',password_salt:salt,password_hash,...changes});
  assert.equal((await attempt(db)).status,401);assert.equal(db.sessions.length,0);
 }
});

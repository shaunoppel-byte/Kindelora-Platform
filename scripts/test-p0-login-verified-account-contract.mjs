// Offline login contract: synthetic accounts only; never contacts Cloudflare, D1 or Resend.
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/member/login.js';
globalThis.crypto ??= webcrypto;
const encoder=new TextEncoder();
const pepper='p'.repeat(40),password='synthetic-test-password-123',email='synthetic@example.invalid',salt='v2:synthetic-salt';
async function passwordHash(){
 const k=await crypto.subtle.importKey('raw',encoder.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const p=await crypto.subtle.sign('HMAC',k,encoder.encode(password));
 const key=await crypto.subtle.importKey('raw',p,'PBKDF2',false,['deriveBits']);
 const bytes=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256);
 return Buffer.from(bytes).toString('hex');
}
function database(account){
 const state={failures:0,locked_until:null,sessions:0,queries:[]};
 return {state,prepare(sql){
  return {bind(...args){
   state.queries.push({sql,args:args.map((v,i)=>sql.includes('member_sessions')&&i===0?'[token-hash]':v)});
   return {
    async first(){
     if(sql.includes('FROM member_login_limits'))return state.failures?{failures:state.failures,locked_until:state.locked_until}:null;
     if(sql.includes('FROM members WHERE'))return account;
     throw Error('Unexpected first query');
    },
    async run(){
     if(sql.startsWith('INSERT INTO member_login_limits')){state.failures=args[1];state.locked_until=args[2];}
     else if(sql.startsWith('DELETE FROM member_login_limits')){state.failures=0;state.locked_until=null;}
     else if(sql.startsWith('INSERT INTO member_sessions'))state.sessions++;
     else throw Error('Unexpected write query: '+sql);
     return {meta:{changes:1}};
    }
   };
  }};
 }};
}
async function login(db,pass=password,origin='https://kindelora.pages.dev',enabled='true'){
 const request=new Request('https://kindelora.pages.dev/api/member/login',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email,password:pass})});
 return onRequestPost({request,env:{MEMBER_AUTH_ENABLED:enabled,MEMBER_AUTH_PEPPER:pepper,DB:db}});
}
const account={id:'synthetic-id',email_normalized:email,password_salt:salt,password_hash:await passwordHash(),email_verified_at:'2026-11-20T00:00:00.000Z',disabled_at:null};
const good=database(account),ok=await login(good);
assert.equal(ok.status,200);
assert.equal((await ok.json()).authenticated,true);
assert.equal(good.state.sessions,1);
assert.match(ok.headers.get('set-cookie')||'',/HttpOnly; SameSite=Strict/);
assert.equal(ok.headers.get('cache-control'),'no-store');
const unverified=database({...account,email_verified_at:null});
assert.equal((await login(unverified)).status,401);
assert.equal(unverified.state.sessions,0);
const disabled=database({...account,disabled_at:'2026-11-20T00:00:00.000Z'});
assert.equal((await login(disabled)).status,401);
const wrong=database(account);
for(let i=0;i<5;i++)assert.equal((await login(wrong,'wrong-password')).status,401);
assert.equal(wrong.state.failures,5);
assert.ok(wrong.state.locked_until);
assert.equal((await login(wrong)).status,429);
assert.equal(wrong.state.sessions,0);
const crossOrigin=database(account);
assert.equal((await login(crossOrigin,password,'https://attacker.invalid')).status,403);
assert.equal(crossOrigin.state.queries.length,0);
assert.equal((await login(database(account),password,'https://kindelora.pages.dev','false')).status,503);
console.log('PASS: synthetic verified login, secure cookie, unverified/disabled rejection, lockout, origin and config gates (offline only)');

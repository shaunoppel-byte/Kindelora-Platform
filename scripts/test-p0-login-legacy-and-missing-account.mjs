// Offline-only regression for the legacy and missing-account login paths.
// No real credentials, external services or production writes.
import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/member/login.js';
const enc=new TextEncoder(),pepper='p'.repeat(40),password='synthetic-legacy-password',email='synthetic-legacy@example.invalid';
async function legacyHash(salt){
 const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 return Buffer.from(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:310000,hash:'SHA-256'},key,256)).toString('hex');
}
function db(user){
 const state={attempts:0,sessions:0,upgrades:0};
 return {
  state,
  prepare(sql){
   return {
    bind(...args){
     return {
      async first(){
       if(sql.includes('FROM member_login_limits'))return null;
       if(sql.includes('FROM members WHERE'))return user;
       throw Error('unexpected read');
      },
      async run(){
       if(sql.startsWith('INSERT INTO member_login_limits'))state.attempts++;
       else if(sql.startsWith('UPDATE members SET password_salt=')){
        state.upgrades++;
        assert.match(args[0],/^v2:/);
        assert.match(args[1],/^[a-f0-9]{64}$/);
       }else if(sql.startsWith('INSERT INTO member_sessions'))state.sessions++;
       else if(!sql.startsWith('DELETE FROM member_login_limits'))throw Error('unexpected write');
       return {meta:{changes:1}};
      }
     };
    }
   };
  }
 };
}
async function login(database,pass=password){
 const request=new Request('https://kindelora.pages.dev/api/member/login',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({email,password:pass})});
 return onRequestPost({request,env:{DB:database,MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper}});
}
const missing=db(null),missingResult=await login(missing);
assert.equal(missingResult.status,401,'missing account must be 401, never 503');
assert.equal(missing.state.attempts,1);
assert.equal(missing.state.sessions,0);
const salt='legacy-synthetic-salt';
const account={id:'synthetic-legacy-id',email_normalized:email,password_salt:salt,password_hash:await legacyHash(salt),email_verified_at:'2026-11-20T00:00:00.000Z',disabled_at:null};
const valid=db(account),success=await login(valid);
assert.equal(success.status,200,'verified legacy account must authenticate');
assert.equal(valid.state.upgrades,1,'legacy hash must upgrade after successful password check');
assert.equal(valid.state.sessions,1);
assert.match(success.headers.get('set-cookie')||'',/HttpOnly; SameSite=Strict/);
const wrong=db(account),rejected=await login(wrong,'incorrect-password');
assert.equal(rejected.status,401);
assert.equal(wrong.state.upgrades,0);
assert.equal(wrong.state.sessions,0);
console.log('PASS: offline missing account 401; legacy PBKDF2 login, safe v2 upgrade, wrong-password rejection; no live authentication proof');

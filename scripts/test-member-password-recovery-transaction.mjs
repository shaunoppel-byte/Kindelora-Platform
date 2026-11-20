import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/member/confirm-password-reset.js';
import {recoveryTokenHash} from '../functions/_lib/member-password-recovery.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const pepper='synthetic-recovery-integration-pepper-1234567890',token='a'.repeat(64);
function mockDB(initial){
 const state={...initial,sessions:2,lockout:1,consumed:null,passwordHash:null,passwordSalt:null,batches:0};
 const prepare=(sql)=>({bind(...args){return {async first(){
  if(sql.includes('SELECT m.email_normalized'))return state.consumed||state.expired||state.disabled?null:{email_normalized:'test@example.com'};
  throw Error('Unexpected SELECT: '+sql);
 },async run(){throw Error('Unexpected run: '+sql)},sql,args}}});
 const db={prepare,async batch(stmts){state.batches++;const results=[];
  for(let i=0;i<stmts.length;i++){
   const {sql,args}=stmts[i];let changes=0;
   if(i===0&&sql.includes('UPDATE member_password_resets')&&!state.consumed&&!state.expired&&!state.disabled){state.consumed=args[1];changes=1}
   if(i===1&&sql.includes('UPDATE members')&&state.consumed===args[3]){state.passwordSalt=args[0];state.passwordHash=args[1];changes=1}
   if(i===2&&sql.includes('DELETE FROM member_sessions')&&state.consumed===args[1]){changes=state.sessions;state.sessions=0}
   if(i===3&&sql.includes('DELETE FROM member_login_limits')&&state.consumed===args[2]){changes=state.lockout;state.lockout=0}
   results.push({meta:{changes}});
  }
  return results;
 }};
 return {db,state};
}
const request=()=>new Request('https://kindelora.pages.dev/api/member/confirm-password-reset',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({token,password:'a-valid-synthetic-password-123'})});
const env=db=>({DB:db,MEMBER_AUTH_ENABLED:'true',MEMBER_PASSWORD_RECOVERY_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper});
test('one successful recovery rotates V2 hash, revokes sessions and clears lockout; replay fails',async()=>{
 const {db,state}=mockDB({});
 const first=await onRequestPost({request:request(),env:env(db)});
 assert.equal(first.status,200);assert.equal((await first.json()).reset,true);
 assert.match(state.passwordSalt,/^v2:/);assert.match(state.passwordHash,/^[a-f0-9]{64}$/);
 assert.equal(state.sessions,0);assert.equal(state.lockout,0);
 const replay=await onRequestPost({request:request(),env:env(db)});
 assert.equal(replay.status,400);assert.equal(state.batches,1);
});
test('expired and disabled recovery tokens cannot change member or session state',async()=>{
 for(const initial of [{expired:true},{disabled:true}]){
  const {db,state}=mockDB(initial);const res=await onRequestPost({request:request(),env:env(db)});
  assert.equal(res.status,400);assert.equal(state.batches,0);assert.equal(state.sessions,2);assert.equal(state.passwordHash,null);
 }
});
test('recovery token hashing remains purpose-scoped',async()=>{
 assert.match(await recoveryTokenHash(token,pepper),/^[a-f0-9]{64}$/);
});

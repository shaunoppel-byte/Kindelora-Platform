import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/member/login.js';

const pepper='p'.repeat(40);
async function storedHash(password,salt){
 const p=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const prehash=await webcrypto.subtle.sign('HMAC',p,new TextEncoder().encode(password));
 const key=await webcrypto.subtle.importKey('raw',prehash,'PBKDF2',false,['deriveBits']);
 return Buffer.from(await webcrypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256)).toString('hex');
}
async function scenario(name,user,expected){
 const previousCrypto=globalThis.crypto,previousLog=console.info,logs=[];
 let writes=0;
 try{
  if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{configurable:true,value:webcrypto});
  console.info=(...args)=>logs.push(args.join(' '));
  const DB={prepare(sql){return {bind(){return {
   async first(){if(sql.startsWith('SELECT failures'))return null;if(sql.startsWith('SELECT id,email_normalized'))return user;throw Error('unexpected SELECT');},
   async run(){writes++;if(sql.startsWith('INSERT INTO member_login_limits'))return {success:true};throw Error('unexpected write');}
  };}}}};
  const request=new Request('https://kindelora.pages.dev/api/member/login',{method:'POST',headers:{origin:'https://kindelora.pages.dev','content-type':'application/json'},body:JSON.stringify({email:'offline@example.invalid',password:'known-password'})});
  const response=await onRequestPost({request,env:{MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:pepper,DB}});
  assert.equal(response.status,401,name);assert.equal(response.headers.get('set-cookie'),null);assert.equal(writes,1);
  assert.deepEqual(logs,['member_login_outcome '+expected]);assert.equal((await response.json()).error,'Invalid credentials');
 }finally{console.info=previousLog;if(previousCrypto===undefined)delete globalThis.crypto;else Object.defineProperty(globalThis,'crypto',{configurable:true,value:previousCrypto});}
}
test('401 diagnostic distinguishes account absent, unverified, disabled and password mismatch without exposing PII',async()=>{
 const salt='v2:offline-salt',hash=await storedHash('known-password',salt);
 const base={id:'offline',email_normalized:'offline@example.invalid',password_salt:salt,password_hash:hash,email_verified_at:'2026-11-20T00:00:00.000Z',disabled_at:null};
 await scenario('missing',null,'account_not_found');
 await scenario('unverified',{...base,email_verified_at:null},'account_unverified');
 await scenario('disabled',{...base,disabled_at:'2026-11-20T00:00:00.000Z'},'account_disabled');
 await scenario('mismatch',{...base,password_hash:'0'.repeat(64)},'password_mismatch');
});

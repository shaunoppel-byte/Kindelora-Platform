import {reply,ready} from './_auth.js';
// Public read-only operational readiness: never returns secret values, account state or DB errors.
// Does not submit credentials, change accounts, or alter registration.
export async function onRequestGet({env}){
 if(!ready(env))return reply({available:false,stage:'configuration'});
 try{
  await env.DB.batch([
   env.DB.prepare('SELECT id,email_normalized,password_salt,password_hash,email_verified_at,disabled_at FROM members LIMIT 0'),
   env.DB.prepare('SELECT key_hash,failures,locked_until FROM member_login_limits LIMIT 0'),
   env.DB.prepare('SELECT token_hash,member_id,expires_at FROM member_sessions LIMIT 0')
  ]);
 }catch{return reply({available:false,stage:'schema'});}
 try{
  // Non-account synthetic crypto self-test using the same HMAC/PBKDF2 primitives as login.
  const enc=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',enc.encode(env.MEMBER_AUTH_PEPPER),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const peppered=await crypto.subtle.sign('HMAC',key,enc.encode('readiness-only-synthetic'));
  const pbkdf=await crypto.subtle.importKey('raw',peppered,'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode('v2:readiness-only'),iterations:100000,hash:'SHA-256'},pbkdf,256);
  if(bits.byteLength!==32)throw Error('unexpected_kdf_length');
 }catch{return reply({available:false,stage:'crypto'});}
 return reply({available:true,stage:'ready'});
}

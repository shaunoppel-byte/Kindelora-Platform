import {reply,ready,hash,random,originOK} from './_auth.js';
import {normalizedMemberEmail,newVerificationToken,verificationTokenHash} from '../../_lib/member-email-verification.js';
import {sendRegistrationVerification} from '../../_lib/member-verification-delivery.js';
const generic=()=>reply({message:'If registration is available, check your email for the next step.'},202);
// Log only fixed reason codes: never email addresses, passwords, tokens, or secrets.
const audit=(reason)=>console.info('member_registration_outcome',reason);
async function turnstile(env,token,ip){
 if(typeof env.TURNSTILE_SECRET_KEY!=='string'||!env.TURNSTILE_SECRET_KEY||typeof token!=='string'||token.length>2048)return false;
 const body=new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:ip});
 const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body});
 if(!r.ok)return false;
 const result=await r.json();return result.success===true&&result.hostname==='kindelora.pages.dev';
}
export async function onRequestPost({request,env}){
 if(env?.PUBLIC_REGISTRATION_ENABLED!=='true'||!ready(env)||typeof env?.RESEND_API_KEY!=='string'||typeof env?.REGISTRATION_FROM_EMAIL!=='string')return reply({error:'Public registration is not configured'},503);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply({error:'JSON required'},415);
 if(Number(request.headers.get('content-length')||0)>4096)return reply({error:'Request too large'},413);
 let data;try{data=await request.json()}catch{return reply({error:'Invalid request'},400)}
 const email=normalizedMemberEmail(data?.email),password=data?.password;
 if(!email||typeof password!=='string'||password.length<12||password.length>256)return reply({error:'Invalid registration details'},400);
 const ip=request.headers.get('cf-connecting-ip')||'unknown';
 if(!await turnstile(env,data.turnstileToken,ip))return reply({error:'Security challenge failed'},403);
 const now=new Date(),windowStart=new Date(now.getTime()-3600000).toISOString(),blockedUntil=new Date(now.getTime()+3600000).toISOString();
 const key=await hash('signup:'+email+':'+env.MEMBER_AUTH_PEPPER);
 // Per-email rate limit; Turnstile provides additional abuse resistance.
 try{
  const limit=await env.DB.prepare('SELECT attempts,window_started_at,blocked_until FROM member_registration_limits WHERE key_hash=?').bind(key).first();
  if(limit?.blocked_until&&limit.blocked_until>now.toISOString()){audit('rate_limit_blocked');return generic();}
  const inWindow=typeof limit?.window_started_at==='string'&&limit.window_started_at>windowStart;
  const attempts=inWindow?(limit.attempts||0)+1:1;
  await env.DB.prepare('INSERT INTO member_registration_limits(key_hash,attempts,window_started_at,blocked_until) VALUES(?,?,?,?) ON CONFLICT(key_hash) DO UPDATE SET attempts=excluded.attempts,window_started_at=excluded.window_started_at,blocked_until=excluded.blocked_until').bind(key,attempts,inWindow?limit.window_started_at:now.toISOString(),attempts>3?blockedUntil:null).run();
  if(attempts>3){audit('rate_limit_exceeded');return generic();}
  const existing=await env.DB.prepare('SELECT id FROM members WHERE email_normalized=?').bind(email).first();
  if(existing){audit('existing_account');return generic();}
  audit('password_hash_started');
  // Stage-only diagnostics; never log member data, salt, password or exception text.
  let salt,keyMaterial;
  try {
   salt=random();
   audit('password_salt_generated');
  } catch {
   audit('password_salt_generation_failed');
   return reply({error:'Registration temporarily unavailable'},503);
  }
  try {
   keyMaterial=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
   audit('password_key_imported');
  } catch {
   audit('password_key_import_failed');
   return reply({error:'Registration temporarily unavailable'},503);
  }
  let derived;
  try {
   derived=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:310000,hash:'SHA-256'},keyMaterial,256);
  } catch {
   // Fixed diagnostic code only; never expose password, salt, key material or exception text.
   audit('password_derivation_failed');
   return reply({error:'Registration temporarily unavailable'},503);
  }
  const passwordHash=Array.from(new Uint8Array(derived),b=>b.toString(16).padStart(2,'0')).join('');
  audit('password_hash_completed');
  let token,tokenHash,expiresAt;
  try {
   token=newVerificationToken();
   tokenHash=await verificationTokenHash(token,env.MEMBER_AUTH_PEPPER);
   expiresAt=new Date(now.getTime()+900000).toISOString();
   audit('verification_token_prepared');
  } catch {
   audit('verification_token_preparation_failed');
   return reply({error:'Registration temporarily unavailable'},503);
  }
  try {
   await env.DB.prepare('INSERT INTO member_email_verifications(token_hash,email_normalized,password_salt,password_hash,expires_at) VALUES(?,?,?,?,?)').bind(tokenHash,email,salt,passwordHash,expiresAt).run();
   audit('verification_record_created');
  } catch {
   // Common cause: legacy 0002 migration created this table without password columns.
   // Never expose database error details or customer information to clients/logs.
   audit('verification_record_insert_failed');
   return reply({error:'Registration temporarily unavailable'},503);
  }
  // A provider failure must not leave an unusable pending registration behind.
  // Delete only this request's token; never delete another concurrent request's token.
  try {
   await sendRegistrationVerification(env,{email,token,origin:new URL(request.url).origin});
  } catch {
   audit('provider_delivery_failed');
   await env.DB.prepare('DELETE FROM member_email_verifications WHERE token_hash=? AND consumed_at IS NULL').bind(tokenHash).run();
   return reply({error:'Verification email delivery is temporarily unavailable'},503);
  }
  audit('provider_accepted');
  return generic();
 }catch{audit('registration_internal_error');return reply({error:'Registration temporarily unavailable'},503)}
}

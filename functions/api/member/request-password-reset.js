// P0 recovery request route. Disabled by default until D1 migration and security review.
import {reply,ready,hash,originOK} from './_auth.js';
import {normalizedMemberEmail} from '../../_lib/member-email-verification.js';
import {newRecoveryToken,recoveryTokenHash} from '../../_lib/member-password-recovery.js';
import {sendPasswordRecovery} from '../../_lib/member-password-recovery-delivery.js';
const generic=()=>reply({message:'If an eligible account exists, check your email for the next step.'},202);
export async function onRequestPost({request,env}){
 if(env?.MEMBER_PASSWORD_RECOVERY_ENABLED!=='true'||!ready(env)||typeof env?.RESEND_API_KEY!=='string'||typeof env?.REGISTRATION_FROM_EMAIL!=='string')return reply({error:'Recovery is not available'},503);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply({error:'JSON required'},415);
 if(Number(request.headers.get('content-length')||0)>2048)return reply({error:'Request too large'},413);
 let data;try{data=await request.json();}catch{return reply({error:'Invalid request'},400)}
 const email=normalizedMemberEmail(data?.email);
 if(!email)return generic();
 const now=new Date(),nowIso=now.toISOString(),windowStart=new Date(now.getTime()-3600000).toISOString(),blockedUntil=new Date(now.getTime()+3600000).toISOString();
 // Separate email and IP buckets prevent bypassing account throttles with alternate IPs.
 const ip=request.headers.get('cf-connecting-ip')||'unknown';
 try{
  for(const keyInput of ['recovery:email:'+email,'recovery:ip:'+ip]){
   const key=await hash(keyInput+':'+env.MEMBER_AUTH_PEPPER);
   const limit=await env.DB.prepare('SELECT attempts,window_started_at,blocked_until FROM member_password_reset_limits WHERE key_hash=?').bind(key).first();
   if(limit?.blocked_until&&limit.blocked_until>nowIso)return generic();
   const inWindow=typeof limit?.window_started_at==='string'&&limit.window_started_at>windowStart;
   const attempts=inWindow?(limit.attempts||0)+1:1;
   await env.DB.prepare('INSERT INTO member_password_reset_limits(key_hash,attempts,window_started_at,blocked_until) VALUES(?,?,?,?) ON CONFLICT(key_hash) DO UPDATE SET attempts=excluded.attempts,window_started_at=excluded.window_started_at,blocked_until=excluded.blocked_until').bind(key,attempts,inWindow?limit.window_started_at:nowIso,attempts>3?blockedUntil:null).run();
   if(attempts>3)return generic();
  }
  const member=await env.DB.prepare('SELECT id FROM members WHERE email_normalized=? AND email_verified_at IS NOT NULL AND disabled_at IS NULL').bind(email).first();
  if(!member)return generic();
  const token=newRecoveryToken(),tokenHash=await recoveryTokenHash(token,env.MEMBER_AUTH_PEPPER),expiry=new Date(now.getTime()+900000).toISOString();
  await env.DB.prepare('INSERT INTO member_password_resets(token_hash,member_id,expires_at) VALUES(?,?,?)').bind(tokenHash,member.id,expiry).run();
  try{await sendPasswordRecovery(env,{email,token,origin:new URL(request.url).origin});}
  catch{
   await env.DB.prepare('DELETE FROM member_password_resets WHERE token_hash=? AND consumed_at IS NULL').bind(tokenHash).run();
   console.info('member_recovery_outcome','provider_delivery_failed');
   return reply({error:'Recovery email temporarily unavailable'},503);
  }
  console.info('member_recovery_outcome','provider_accepted');
  return generic();
 }catch{console.info('member_recovery_outcome','recovery_unavailable');return reply({error:'Recovery temporarily unavailable'},503)}
}

// P0 recovery confirmation. Fail-closed until migration, tests and security review.
// Does not alter registration, verification, login or PLUS entitlements.
import {reply,ready,originOK,hash} from './_auth.js';
import {recoveryTokenHash,newRecoveryPasswordHash} from '../../_lib/member-password-recovery.js';
const invalid=()=>reply({error:'Invalid or expired recovery link'},400);
export async function onRequestPost({request,env}){
 if(env?.MEMBER_PASSWORD_RECOVERY_ENABLED!=='true'||!ready(env))return reply({error:'Recovery is not available'},503);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply({error:'JSON required'},415);
 if(Number(request.headers.get('content-length')||0)>4096)return reply({error:'Request too large'},413);
 let data;try{data=await request.json();}catch{return reply({error:'Invalid request'},400)}
 const token=data?.token,password=data?.password;
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||typeof password!=='string'||password.length<12||password.length>256)return invalid();
 try{
  const tokenHash=await recoveryTokenHash(token,env.MEMBER_AUTH_PEPPER);
  const now=new Date().toISOString(),claim=crypto.randomUUID();
  // Derive before claiming token so a runtime crypto failure cannot consume it.
  const {salt,passwordHash}=await newRecoveryPasswordHash(password,env.MEMBER_AUTH_PEPPER);
  // D1 batch is a transaction. Each subsequent mutation is gated on this
  // request's unique consumed_nonce, preventing replay/concurrent claims.
  const results=await env.DB.batch([
   env.DB.prepare('UPDATE member_password_resets SET consumed_at=?,consumed_nonce=? WHERE token_hash=? AND consumed_at IS NULL AND expires_at>? AND EXISTS (SELECT 1 FROM members m WHERE m.id=member_password_resets.member_id AND m.email_verified_at IS NOT NULL AND m.disabled_at IS NULL)').bind(now,claim,tokenHash,now),
   env.DB.prepare('UPDATE members SET password_salt=?,password_hash=? WHERE id=(SELECT member_id FROM member_password_resets WHERE token_hash=? AND consumed_nonce=?) AND email_verified_at IS NOT NULL AND disabled_at IS NULL').bind(salt,passwordHash,tokenHash,claim),
   env.DB.prepare('DELETE FROM member_sessions WHERE member_id=(SELECT member_id FROM member_password_resets WHERE token_hash=? AND consumed_nonce=?)').bind(tokenHash,claim),
   env.DB.prepare('DELETE FROM member_login_limits WHERE key_hash=(SELECT lower(hex(sha256(email_normalized))) FROM members WHERE id=(SELECT member_id FROM member_password_resets WHERE token_hash=? AND consumed_nonce=?))').bind(tokenHash,claim)
  ]);
  if(results?.[0]?.meta?.changes!==1||results?.[1]?.meta?.changes!==1)return invalid();
  console.info('member_recovery_outcome','password_updated');
  return reply({reset:true,signInRequired:true},200);
 }catch{
  console.info('member_recovery_outcome','confirmation_unavailable');
  return reply({error:'Password recovery temporarily unavailable'},503);
 }
}

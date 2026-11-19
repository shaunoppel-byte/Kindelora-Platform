import {reply,ready,hash,originOK} from './_auth.js';
import {verificationTokenHash} from '../../_lib/member-email-verification.js';
// Atomic one-time verification. No public signup enabled by this endpoint.
export async function onRequestPost({request,env}){
 if(env?.PUBLIC_REGISTRATION_ENABLED!=='true'||!ready(env))return reply({error:'Email verification is not configured'},503);
 if(!originOK(request))return reply({error:'Invalid origin'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply({error:'JSON required'},415);
 let data;try{data=await request.json()}catch{return reply({error:'Invalid request'},400)}
 const token=data?.token;
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return reply({error:'Invalid or expired verification link'},400);
 const tokenHash=await verificationTokenHash(token,env.MEMBER_AUTH_PEPPER);
 const now=new Date().toISOString();
 // A single atomic INSERT SELECT only creates an account if the token is unused, unexpired,
 // and its email is not already registered. Subsequent UPDATE consumes the token.
 // D1 batch is transactional; rollback prevents partial activation.
 try{
  const results=await env.DB.batch([
   env.DB.prepare("INSERT INTO members(id,email_normalized,password_salt,password_hash,email_verified_at) SELECT ?,v.email_normalized,v.password_salt,v.password_hash,? FROM member_email_verifications v WHERE v.token_hash=? AND v.consumed_at IS NULL AND v.expires_at>? AND NOT EXISTS (SELECT 1 FROM members m WHERE m.email_normalized=v.email_normalized)").bind(crypto.randomUUID(),now,tokenHash,now),
   env.DB.prepare("UPDATE member_email_verifications SET consumed_at=? WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?").bind(now,tokenHash,now)
  ]);
  if(results?.[0]?.meta?.changes!==1||results?.[1]?.meta?.changes!==1)return reply({error:'Invalid or expired verification link'},409);
 }catch{return reply({error:'Verification unavailable or already completed'},409)}
 return reply({verified:true,signInRequired:true},200);
}

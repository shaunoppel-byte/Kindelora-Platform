import {normalizedMemberEmail,verificationTokenHash,verificationTokenEligible} from './member-email-verification.js';
// Server-side single-use email verification persistence; no public endpoint or mail delivery.
// D1 transaction via conditional UPDATE ensures only one consumer can win.
export async function consumeEmailVerification({db,token,pepper,email,now=new Date().toISOString()}={}){
 const normalized=normalizedMemberEmail(email);
 if(!db||typeof db.prepare!=='function'||!normalized)return {verified:false,reason:'unavailable'};
 let hash;try{hash=await verificationTokenHash(token,pepper)}catch{return {verified:false,reason:'unavailable'}}
 try{
  const record=await db.prepare('SELECT email_normalized,expires_at,consumed_at FROM member_email_verifications WHERE token_hash=?').bind(hash).first();
  if(!verificationTokenEligible({email:record?.email_normalized,requestedEmail:normalized,expiresAt:record?.expires_at,consumedAt:record?.consumed_at,now}))return {verified:false,reason:'invalid_or_expired'};
  // Conditional mutation rejects expiry/replay even when two requests race.
  const result=await db.prepare('UPDATE member_email_verifications SET consumed_at=? WHERE token_hash=? AND email_normalized=? AND consumed_at IS NULL AND expires_at>?').bind(now,hash,normalized,now).run();
  return result?.meta?.changes===1?{verified:true,email:normalized}:{verified:false,reason:'invalid_or_expired'};
 }catch{return {verified:false,reason:'unavailable'}}
}

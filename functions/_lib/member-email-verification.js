// Public registration email verification primitives. No route or email delivery.
// Tokens are created server-side; only peppered hashes belong in D1.
export function normalizedMemberEmail(input){
 if(typeof input!=='string')return null;
 const email=input.trim().toLowerCase();
 if(email.length>254||! /^[^\s@]{1,64}@[^\s@]+\.[^\s@]+$/.test(email))return null;
 return email;
}
export function newVerificationToken(){
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 return Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
}
export async function verificationTokenHash(token,pepper){
 if(typeof token!=='string'||! /^[a-f0-9]{64}$/.test(token))throw Error('Invalid token');
 if(typeof pepper!=='string'||pepper.length<32)throw Error('Verification not configured');
 const bytes=new TextEncoder().encode('KINDELORA:verify-email:v1:'+token+':'+pepper);
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
}
export function verificationTokenEligible({email,requestedEmail,expiresAt,consumedAt,now=new Date().toISOString()}={}){
 const expected=normalizedMemberEmail(email),requested=normalizedMemberEmail(requestedEmail);
 if(!expected||expected!==requested||consumedAt!==null||typeof expiresAt!=='string')return false;
 const expiry=Date.parse(expiresAt),instant=Date.parse(now);
 return Number.isFinite(expiry)&&Number.isFinite(instant)&&expiry>instant;
}

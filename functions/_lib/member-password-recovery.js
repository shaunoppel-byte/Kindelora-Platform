// Dedicated password-recovery primitives. Not wired to public routes until security gates pass.
// Never reuse registration tokens for account recovery.
const encoder=new TextEncoder();
export function newRecoveryToken(){
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
export async function recoveryTokenHash(token,pepper){
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw Error('Invalid recovery token');
 if(typeof pepper!=='string'||pepper.length<32)throw Error('Recovery not configured');
 const material=encoder.encode('KINDELORA:password-recovery:v1:'+token+':'+pepper);
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',material)),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function newRecoveryPasswordHash(password,pepper){
 if(typeof password!=='string'||password.length<12||password.length>256)throw Error('Invalid new password');
 if(typeof pepper!=='string'||pepper.length<32)throw Error('Recovery not configured');
 const salt='v2:'+newRecoveryToken();
 const key=await crypto.subtle.importKey('raw',encoder.encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const material=await crypto.subtle.sign('HMAC',key,encoder.encode(password));
 const pbkdf=await crypto.subtle.importKey('raw',material,'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},pbkdf,256);
 const passwordHash=Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('');
 return {salt,passwordHash};
}

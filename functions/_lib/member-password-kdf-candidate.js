// Candidate password KDF for Workers: draft-only until security and runtime review.
// Legacy accounts have an unprefixed hex salt and require 310000 PBKDF2 rounds;
// those cannot be verified on a Worker that caps a single deriveBits call at 100000.
// DO NOT enable for production until a secure legacy migration strategy exists.
const enc=new TextEncoder();
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const bytes=hexString=>new Uint8Array(hexString.match(/../g).map(x=>parseInt(x,16)));
export const NEW_SALT_PREFIX='v2:';
export const newPasswordSalt=()=>NEW_SALT_PREFIX+hex(crypto.getRandomValues(new Uint8Array(32)));
export async function derivePassword(password,salt){
 if(typeof password!=='string'||typeof salt!=='string')throw Error('Invalid password derivation input');
 if(!salt.startsWith(NEW_SALT_PREFIX))throw Error('Legacy PBKDF2 hash requires migration');
 const raw=salt.slice(NEW_SALT_PREFIX.length);
 if(!/^[a-f0-9]{64}$/.test(raw))throw Error('Invalid password salt');
 // Domain-separated, sequential 100k-round PBKDF2 invocations; no call exceeds
 // the Workers per-operation cap. This is a NEW scheme, NOT PBKDF2(400000).
 let material=enc.encode(password);
 for(let i=0;i<4;i++){
  const key=await crypto.subtle.importKey('raw',material,'PBKDF2',false,['deriveBits']);
  const stageSalt=new Uint8Array(33);
  stageSalt.set(bytes(raw));stageSalt[32]=i;
  material=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:stageSalt,iterations:100000,hash:'SHA-256'},key,256));
 }
 return hex(material);
}

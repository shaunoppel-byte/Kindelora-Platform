// Local-only workerd compatibility probe. Do not deploy this test endpoint.
// Exercises both the candidate and the original production derivation API.
import {derivePassword} from '../functions/_lib/member-password-kdf-candidate.js';
const enc=new TextEncoder();
export default {
 async fetch(request) {
  const path=new URL(request.url).pathname;
  if(path!=='/probe'&&path!=='/legacy-limit')return new Response('Not found',{status:404});
  if(path==='/legacy-limit'){
   try {
    const key=await crypto.subtle.importKey('raw',enc.encode('runtime-test-only'),'PBKDF2',false,['deriveBits']);
    await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode('local-test-salt'),iterations:310000,hash:'SHA-256'},key,256);
    return new Response('LEGACY_310K_SUPPORTED',{status:200});
   } catch {
    // Fixed reason code, no secret values or exception strings.
    return new Response('LEGACY_310K_REJECTED',{status:200});
   }
  }
  try {
   const salt='v2:'+'ab'.repeat(32);
   const first=await derivePassword('test-password-for-runtime-only',salt);
   const second=await derivePassword('test-password-for-runtime-only',salt);
   if(first!==second||!/^[a-f0-9]{64}$/.test(first))return new Response('KDF output mismatch',{status:500});
   return new Response('KDF_RUNTIME_OK',{status:200});
  } catch {
   return new Response('KDF_RUNTIME_FAILED',{status:503});
  }
 }
};

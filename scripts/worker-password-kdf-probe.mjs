// Local-only workerd compatibility probe. Do not deploy this test endpoint.
import {derivePassword} from '../functions/_lib/member-password-kdf-candidate.js';
export default {
 async fetch(request) {
  if(new URL(request.url).pathname!=='/probe')return new Response('Not found',{status:404});
  try {
   const salt='v2:'+'ab'.repeat(32);
   const first=await derivePassword('test-password-for-runtime-only',salt);
   const second=await derivePassword('test-password-for-runtime-only',salt);
   if(first!==second||!/^[a-f0-9]{64}$/.test(first))return new Response('KDF output mismatch',{status:500});
   return new Response('KDF_RUNTIME_OK',{status:200});
  } catch {
   // No exception details or sensitive input are exposed.
   return new Response('KDF_RUNTIME_FAILED',{status:503});
  }
 }
};

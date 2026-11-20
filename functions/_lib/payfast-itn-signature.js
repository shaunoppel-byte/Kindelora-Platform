// Offline PayFast ITN signature check. Signature validation alone never grants PLUS.
// Must ALSO verify PayFast source, provider-side confirmation, merchant/order/amount,
// and durable idempotent persistence before any subscription transition.
// https://developers.payfast.co.za/docs/itn-instant-transaction-notification/
import {canonicalItnPayload,isMd5Hex} from './payfast-itn-canonical.js';
export async function verifyItnSignature(form,passphrase,subtle=crypto.subtle){
 if(!(form instanceof URLSearchParams))return false;
 const submitted=form.getAll('signature');
 if(submitted.length!==1||!isMd5Hex(submitted[0]))return false;
 let canonical;
 try{canonical=canonicalItnPayload(form,passphrase);}catch{return false;}
 const bytes=new TextEncoder().encode(canonical);
 const digest=await subtle.digest('MD5',bytes);
 const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const expected=submitted[0].toLowerCase();
 if(actual.length!==expected.length)return false;
 let difference=0;
 for(let i=0;i<actual.length;i++)difference|=actual.charCodeAt(i)^expected.charCodeAt(i);
 return difference===0;
}

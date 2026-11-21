// Server-only PayFast ITN MD5 verification. Requires trusted merchant passphrase.
// Signature alone does not authenticate source, provider status, merchant or amount.
import {md5} from './payfast-md5.js';
import {buildPayFastItnSignaturePayload} from './payfast-itn-signature-payload.js';
const deny=reason=>({verified:false,reason});
export function verifyPayFastItnSignature({raw,passphrase}={}){
 if(typeof passphrase!=='string'||passphrase.length<1||passphrase.length>256)return deny('passphrase_unavailable');
 const candidate=buildPayFastItnSignaturePayload({raw,passphrase});
 if(!candidate.ok)return deny('invalid_payload');
 const expected=md5(candidate.payload),received=candidate.signature;
 let difference=0;
 for(let i=0;i<32;i++)difference|=expected.charCodeAt(i)^received.charCodeAt(i);
 return difference===0?{verified:true,reason:'signature_valid'}:deny('signature_mismatch');
}

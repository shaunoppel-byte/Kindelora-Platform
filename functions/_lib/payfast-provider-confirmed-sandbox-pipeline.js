// Server-only sandbox integration. PayFast provider confirmation is performed
// independently, never accepted as a caller-supplied serverVerified flag.
// Signature and provider confirmation are independently verified here.
// Source and quote verification still require trusted server implementation;
// these flags must NEVER originate from a public HTTP request.
// No public route, charges, or PLUS entitlement activation.
import {verifyPayFastItnWithServer} from './payfast-itn-server-validation.js';
import {verifyPayFastItnSignature} from './payfast-itn-signature-verification.js';
import {processVerifiedSandboxItnOffline} from './payfast-sandbox-persisted-itn-pipeline.js';
const deny=reason=>({committed:false,grantEntitlement:false,reason});
export async function processProviderConfirmedSandboxItn({db,raw,contentType,
 expectedMerchantId,verification,fetchImpl,passphrase}={}){
 if(!verification||verification.sourceVerified!==true||verification.quoteVerified!==true)
  return deny('independent_verification_required');
 const signature=verifyPayFastItnSignature({raw,passphrase});
 if(!signature.verified)return deny('signature_verification_failed');
 const confirmed=await verifyPayFastItnWithServer({raw,environment:'sandbox',fetchImpl});
 if(!confirmed.verified)return deny('provider_confirmation_failed');
 // The provider result always overrides any caller-supplied serverVerified value.
 return processVerifiedSandboxItnOffline({db,raw,contentType,expectedMerchantId,
  verification:{signatureVerified:signature.verified,
   sourceVerified:verification.sourceVerified,quoteVerified:verification.quoteVerified,
   serverVerified:confirmed.verified}});
}

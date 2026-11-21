// Server-only sandbox integration. PayFast provider confirmation is performed
// independently, never accepted as a caller-supplied serverVerified flag.
// Other security gates (signature/source/quote) still require trusted server
// verification and must NOT be supplied by a public HTTP request.
// No public route, charges, or PLUS entitlement activation.
import {verifyPayFastItnWithServer} from './payfast-itn-server-validation.js';
import {processVerifiedSandboxItnOffline} from './payfast-sandbox-persisted-itn-pipeline.js';
const deny=reason=>({committed:false,grantEntitlement:false,reason});
export async function processProviderConfirmedSandboxItn({db,raw,contentType,
 expectedMerchantId,verification,fetchImpl}={}){
 if(!verification||verification.signatureVerified!==true||
  verification.sourceVerified!==true||verification.quoteVerified!==true)
  return deny('independent_verification_required');
 const confirmed=await verifyPayFastItnWithServer({raw,environment:'sandbox',fetchImpl});
 if(!confirmed.verified)return deny('provider_confirmation_failed');
 // The provider result always overrides any caller-supplied serverVerified value.
 return processVerifiedSandboxItnOffline({db,raw,contentType,expectedMerchantId,
  verification:{signatureVerified:verification.signatureVerified,
   sourceVerified:verification.sourceVerified,quoteVerified:verification.quoteVerified,
   serverVerified:confirmed.verified}});
}

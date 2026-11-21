// Server-only sandbox integration. PayFast provider confirmation is performed
// independently, never accepted as a caller-supplied serverVerified flag.
// Signature and provider confirmation are independently verified here.
// Source is checked against an operator-configured allowlist; quote verification
// still requires independent trusted server implementation;
// these flags must NEVER originate from a public HTTP request.
// No public route, charges, or PLUS entitlement activation.
import {verifyPayFastItnWithServer} from './payfast-itn-server-validation.js';
import {verifyPayFastItnSignature} from './payfast-itn-signature-verification.js';
import {verifyPayFastCloudflareSource} from './payfast-cloudflare-source-allowlist.js';
import {processVerifiedSandboxItnOffline} from './payfast-sandbox-persisted-itn-pipeline.js';
const deny=reason=>({committed:false,grantEntitlement:false,reason});
export async function processProviderConfirmedSandboxItn({db,raw,contentType,
 expectedMerchantId,verification,fetchImpl,passphrase,request,allowedCidrs}={}){
 // Quote verification is performed independently against D1 before ledger commit.
 const source=verifyPayFastCloudflareSource({request,allowedCidrs});
 if(!source.verified)return deny('source_verification_failed');
 const signature=verifyPayFastItnSignature({raw,passphrase});
 if(!signature.verified)return deny('signature_verification_failed');
 // Provider outages and malformed responses must never reach ledger persistence.
 let confirmed;
 try {confirmed=await verifyPayFastItnWithServer({raw,environment:'sandbox',fetchImpl});}
 catch {return deny('provider_confirmation_unavailable');}
 if(!confirmed?.verified)return deny('provider_confirmation_failed');
 // The provider result always overrides any caller-supplied serverVerified value.
 return processVerifiedSandboxItnOffline({db,raw,contentType,expectedMerchantId,
  verification:{signatureVerified:signature.verified,
   sourceVerified:source.verified,
   serverVerified:confirmed.verified}});
}

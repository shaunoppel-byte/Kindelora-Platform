// Server-only PayFast LIVE ITN authentication gate. Does not write D1 or grant PLUS.
// A route must pass the original raw form body, trusted Cloudflare request,
// server-owned merchant ID/passphrase and operator-approved PayFast source CIDRs.
import {parseSandboxItnEnvelope} from './payfast-sandbox-itn-envelope.js';
import {verifyPayFastCloudflareSource} from './payfast-cloudflare-source-allowlist.js';
import {verifyPayFastItnSignature} from './payfast-itn-signature-verification.js';
import {verifyPayFastItnWithServer} from './payfast-itn-server-validation.js';
const deny=reason=>({authenticated:false,reason,grantEntitlement:false});
export async function authenticateLivePayFastItn({request,raw,merchantId,passphrase,allowedCidrs,fetchImpl}={}){
 if(!request||typeof request.headers?.get!=='function'||typeof merchantId!=='string'||
  !/^[0-9]{8,16}$/.test(merchantId)||typeof passphrase!=='string'||!passphrase||
  typeof allowedCidrs!=='string'||!allowedCidrs.trim())return deny('configuration_unavailable');
 const envelope=parseSandboxItnEnvelope(raw,request.headers.get('content-type'));
 if(!envelope.ok)return deny('invalid_envelope');
 if(envelope.merchantId!==merchantId||envelope.paymentStatus!=='COMPLETE')return deny('merchant_or_status_mismatch');
 const source=verifyPayFastCloudflareSource({request,allowedCidrs});
 if(!source.verified)return deny('source_not_verified');
 const signature=verifyPayFastItnSignature({raw,passphrase});
 if(!signature.verified)return deny('signature_not_verified');
 const provider=await verifyPayFastItnWithServer({raw,environment:'live',fetchImpl});
 if(!provider.verified)return deny('provider_not_verified');
 // Only consume a recurring token from the exact signed, source-checked,
 // provider-validated notification. Never accept a browser-provided token.
 // Missing or malformed tokens remain ineligible for renewal reconciliation.
 const fields=new URLSearchParams(raw);
 const token=fields.get('token');
 const providerSubscriptionToken=typeof token==='string'&&
  /^[A-Za-z0-9_-]{8,128}$/.test(token)?token:null;
 return {authenticated:true,reason:'live_provider_confirmed',grantEntitlement:false,
  payment:Object.freeze({verified:true,environment:'live',paymentStatus:'COMPLETE',
   merchantReference:envelope.merchantReference,providerTransactionId:envelope.providerTransactionId,
   merchantId:envelope.merchantId,amountMinor:envelope.amountZarMinor,
   providerSubscriptionToken})};
}

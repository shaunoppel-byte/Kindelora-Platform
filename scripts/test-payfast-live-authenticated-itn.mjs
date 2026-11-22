import assert from 'node:assert/strict';
import {authenticateLivePayFastItn as authenticate} from '../functions/_lib/payfast-live-authenticated-itn.js';
const request={headers:{get(key){return key==='content-type'?'application/x-www-form-urlencoded':'192.0.2.12'}}};
const base={request,merchantId:'10000100',passphrase:'server-only-passphrase',allowedCidrs:'192.0.2.0/24',raw:'m_payment_id=order_12345678&pf_payment_id=provider_12345678&payment_status=COMPLETE&amount_gross=165.00&merchant_id=10000100&signature=00000000000000000000000000000000',fetchImpl:async()=>{throw Error('should not call')}};
for(const bad of [{merchantId:'10000101'},{merchantId:''},{passphrase:''},{allowedCidrs:''},{raw:''},{raw:base.raw.replace('COMPLETE','FAILED')},{request:{headers:{get(key){return key==='content-type'?'application/json':'192.0.2.12'}}}},{request:{headers:{get(key){return key==='content-type'?'application/x-www-form-urlencoded':'198.51.100.1'}}}}]){
 const result=await authenticate({...base,...bad});assert.equal(result.authenticated,false);assert.equal(result.grantEntitlement,false);
}
const signatureFailure=await authenticate(base);assert.equal(signatureFailure.authenticated,false);assert.equal(signatureFailure.reason,'signature_not_verified');
console.log('PASS: live ITN gate fails closed for malformed merchant source and unsigned payload');

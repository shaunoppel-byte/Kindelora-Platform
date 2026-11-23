import assert from 'node:assert/strict';
import {md5} from '../functions/_lib/payfast-md5.js';
import {authenticateLivePayFastItn as authenticate} from '../functions/_lib/payfast-live-authenticated-itn.js';
const request={headers:{get(key){return key==='content-type'?'application/x-www-form-urlencoded':'192.0.2.12'}}};
const base={request,merchantId:'10000100',passphrase:'server-only-passphrase',allowedCidrs:'192.0.2.0/24',raw:'m_payment_id=order_12345678&pf_payment_id=provider_12345678&payment_status=COMPLETE&amount_gross=165.00&merchant_id=10000100&signature=00000000000000000000000000000000',fetchImpl:async()=>{throw Error('should not call')}};
for(const bad of [{merchantId:'10000101'},{merchantId:''},{passphrase:''},{allowedCidrs:''},{raw:''},{raw:base.raw.replace('COMPLETE','FAILED')},{request:{headers:{get(key){return key==='content-type'?'application/json':'192.0.2.12'}}}},{request:{headers:{get(key){return key==='content-type'?'application/x-www-form-urlencoded':'198.51.100.1'}}}}]){
 const result=await authenticate({...base,...bad});assert.equal(result.authenticated,false);assert.equal(result.grantEntitlement,false);
}
const signatureFailure=await authenticate(base);assert.equal(signatureFailure.authenticated,false);assert.equal(signatureFailure.reason,'signature_not_verified');

const signedFields='m_payment_id=order_12345678&pf_payment_id=provider_12345678&payment_status=COMPLETE&amount_gross=165.00&merchant_id=10000100&token=recurring_token_12345678';
const signedRaw=signedFields+'&signature='+md5(signedFields+'&passphrase=server-only-passphrase');
const valid=await authenticate({...base,raw:signedRaw,
 fetchImpl:async(url,options)=>{
  assert.equal(url,'https://www.payfast.co.za/eng/query/validate');
  assert.equal(options.method,'POST');
  assert.equal(options.redirect,'manual');
  return {status:200,ok:true,async text(){return 'VALID'}};
 }});
assert.equal(valid.authenticated,true);
assert.equal(valid.grantEntitlement,false);
assert.equal(valid.payment.verified,true);
assert.equal(valid.payment.providerSubscriptionToken,'recurring_token_12345678');
assert.equal(valid.payment.merchantReference,'order_12345678');
assert.equal(valid.payment.amountMinor,16500);
const noTokenFields=signedFields.replace('&token=recurring_token_12345678','');
const noToken=await authenticate({...base,raw:noTokenFields+'&signature='+md5(noTokenFields+'&passphrase=server-only-passphrase'),
 fetchImpl:async()=>({status:200,ok:true,async text(){return 'VALID'}})});
assert.equal(noToken.authenticated,true);
assert.equal(noToken.payment.providerSubscriptionToken,null);

console.log('PASS: live ITN rejects malformed requests and passes authenticated synthetic recurring-token contract; no writes');

import assert from 'node:assert/strict';
import {prepareAuthenticatedLivePlusActivation as prepare} from '../functions/_lib/payfast-live-plus-activation-preflight.js';
const request={headers:{get(key){return key==='content-type'?'application/x-www-form-urlencoded':'192.0.2.12'}}};
const base={request,merchantId:'10000100',passphrase:'server-only-passphrase',allowedCidrs:'192.0.2.0/24',raw:'m_payment_id=order_12345678&pf_payment_id=provider_12345678&payment_status=COMPLETE&amount_gross=165.00&merchant_id=10000100&signature=00000000000000000000000000000000',subscriptionId:'subscription_12345678',nowMs:1795348800000};
let reads=0;const db={prepare(){reads++;throw Error('must not read unauthenticated payment')}};
for(const bad of [{subscriptionId:'bad'},{raw:''},{passphrase:''},{merchantId:'10000101'},{allowedCidrs:''}]){
 const result=await prepare({...base,db,...bad});assert.equal(result.ready,false);assert.equal(result.grantEntitlement,false);
}
assert.equal(reads,0);
const result=await prepare({...base,db:null});assert.equal(result.ready,false);assert.equal(result.reason,'invalid_preflight');
console.log('PASS: authenticated live PLUS preflight rejects untrusted inputs without DB writes');

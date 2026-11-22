import assert from 'node:assert/strict';
import {processAuthenticatedLivePlusPayment as process} from '../functions/_lib/payfast-live-transaction-pipeline.js';
let reads=0,writes=0;const db={prepare(){reads++;throw Error('unauthenticated ITN must not read D1')},async batch(){writes++;throw Error('unauthenticated ITN must not write D1')}};
const request={headers:{get(key){return key==='content-type'?'application/x-www-form-urlencoded':'192.0.2.12'}}};
const base={db,request,merchantId:'10000100',passphrase:'server-only-passphrase',allowedCidrs:'192.0.2.0/24',raw:'m_payment_id=order_12345678&pf_payment_id=provider_12345678&payment_status=COMPLETE&amount_gross=165.00&merchant_id=10000100&signature=00000000000000000000000000000000',subscriptionId:'subscription_12345678',nowMs:1795348800000};
for(const change of [{raw:''},{passphrase:''},{allowedCidrs:''},{merchantId:'10000101'},{subscriptionId:'bad'},{raw:base.raw.replace('COMPLETE','FAILED')}]){
 const r=await process({...base,...change});assert.equal(r.committed,false);assert.equal(r.grantEntitlement,false);
}
assert.equal(reads,0);assert.equal(writes,0);
assert.equal((await process({...base,db:null})).committed,false);
console.log('PASS: live payment pipeline rejects unauthenticated requests before D1 writes');

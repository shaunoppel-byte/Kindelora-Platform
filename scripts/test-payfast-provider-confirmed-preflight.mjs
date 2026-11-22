import assert from 'node:assert/strict';
import {processProviderConfirmedSandboxItn as process} from '../functions/_lib/payfast-provider-confirmed-sandbox-pipeline.js';
const contentType='application/x-www-form-urlencoded';
const raw=new URLSearchParams({m_payment_id:'order_12345678',pf_payment_id:'provider_12345678',payment_status:'COMPLETE',amount_gross:'178.90',merchant_id:'10000100',signature:'a'.repeat(32)}).toString();
let calls=0;
const fetchImpl=async()=>{calls++;throw Error('provider must not be contacted')};
const args={raw,contentType,expectedMerchantId:'10000100',fetchImpl};
for(const overrides of [{raw:'bad'}, {contentType:'application/json'}, {expectedMerchantId:'99999999'}, {raw:raw+'&signature='+('b'.repeat(32))}]){
 const result=await process({...args,...overrides});
 assert.equal(result.committed,false);
 assert.equal(result.grantEntitlement,false);
}
assert.equal(calls,0);
console.log('PASS: invalid/wrong-merchant PayFast ITNs rejected without provider calls');

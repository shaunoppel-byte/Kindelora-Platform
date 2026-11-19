import assert from 'node:assert/strict';
import {verifyPaidOrderMatch} from '../functions/_lib/plus-itn-order-match.js';
const order={id:'ord_123',merchantId:'merchant_123',amount:'89.99',currency:'USD',status:'pending'};
const notification={m_payment_id:'ord_123',merchant_id:'merchant_123',amount_gross:'89.99',currency:'USD',payment_status:'COMPLETE',pf_payment_id:'pay_123'};
const valid={order,notification,signatureVerified:true,providerConfirmed:true};
assert.deepEqual(verifyPaidOrderMatch(valid),{accepted:true,providerPaymentId:'pay_123'});
for(const patch of [{signatureVerified:false},{providerConfirmed:false},{order:{...order,status:'paid'}},{order:{...order,amount:'8.99'}},{order:{...order,currency:'ZAR'}},{notification:{...notification,payment_status:'FAILED'}},{notification:{...notification,m_payment_id:'another'}},{notification:{...notification,merchant_id:'another'}},{notification:{...notification,amount_gross:'89.98'}},{notification:{...notification,currency:'ZAR'}},{notification:{...notification,pf_payment_id:'../bad'}},{notification:{...notification,amount_gross:'89.990'}}]){
 const result=verifyPaidOrderMatch({...valid,...patch});
 assert.equal(result.accepted,false,JSON.stringify(patch));
}
assert.equal(verifyPaidOrderMatch({}).accepted,false);
console.log('PASS: payment notification matching denies forged, incomplete, mismatched and duplicate-state payment claims');

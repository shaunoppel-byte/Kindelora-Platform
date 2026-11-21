import assert from 'node:assert/strict';
import {parseSandboxItnEnvelope as parse} from '../functions/_lib/payfast-sandbox-itn-envelope.js';
import {validateSandboxItnMerchant as gate} from '../functions/_lib/payfast-sandbox-merchant-gate.js';
const raw=new URLSearchParams({m_payment_id:'order_12345678',pf_payment_id:'provider_12345678',
 payment_status:'COMPLETE',amount_gross:'178.90',merchant_id:'10000100',signature:'a'.repeat(32)}).toString();
const envelope=parse(raw,'application/x-www-form-urlencoded');
const expectedOrder={environment:'sandbox',reference:'order_12345678',zarMinor:17890};
const base={envelope,expectedMerchantId:'10000100',expectedOrder};
assert.deepEqual(gate(base),{ok:true,merchantVerified:true,orderVerified:true,amountVerified:true,
 authenticated:false,grantEntitlement:false});
for(const bad of [
 {...base,expectedMerchantId:'10000101'},
 {...base,expectedMerchantId:undefined},
 {...base,expectedOrder:{...expectedOrder,reference:'other_order'}},
 {...base,expectedOrder:{...expectedOrder,zarMinor:17891}},
 {...base,expectedOrder:{...expectedOrder,environment:'live'}},
 {...base,envelope:{...envelope,paymentStatus:'PENDING'}},
 {...base,envelope:{...envelope,authenticated:true}},
 {...base,envelope:{...envelope,grantEntitlement:true}},
 {...base,envelope:null},
 {...base,expectedOrder:null}
])assert.equal(gate(bad).ok,false,'reject malformed/mismatched merchant or order');
console.log('PASS: merchant/order gate checks exact merchant, reference, amount, status without authenticating');

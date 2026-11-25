import assert from 'node:assert/strict';
import {evaluateSandboxItnOffline as evaluate} from '../functions/_lib/payfast-sandbox-itn-orchestrator.js';
const raw=new URLSearchParams({m_payment_id:'order_12345678',pf_payment_id:'provider_12345678',
 payment_status:'COMPLETE',amount_gross:'178.90',merchant_id:'10000100',signature:'a'.repeat(32)}).toString();
const base={raw,contentType:'application/x-www-form-urlencoded',expectedMerchantId:'10000100',
 expectedOrder:{environment:'sandbox',reference:'order_12345678',zarMinor:17890,plan:'monthly'},
 signatureVerified:true,serverVerified:true,sourceVerified:true,quoteVerified:true,
 memberVerified:true,storedTransaction:null,storedOrder:null};
const approved=evaluate(base);
assert.equal(approved.stage,'pending_atomic_commit');
assert.equal(approved.accepted,false);
assert.equal(approved.grantEntitlement,false);
// Match the verified PayFast Sandbox case: 157.728 maps to the server-stored R157.72
// order amount, and the decision remains fail-closed for any other order amount.
const fractionalRaw=raw.replace('178.90','157.728');
const fractional=evaluate({...base,raw:fractionalRaw,
 expectedOrder:{...base.expectedOrder,zarMinor:15772}});
assert.equal(fractional.stage,'pending_atomic_commit');
assert.equal(fractional.paidMinor,15772);
assert.equal(fractional.grantEntitlement,false);
const mismatchedFractional=evaluate({...base,raw:fractionalRaw,
 expectedOrder:{...base.expectedOrder,zarMinor:15773}});
assert.notEqual(mismatchedFractional.stage,'pending_atomic_commit');
assert.equal(mismatchedFractional.grantEntitlement,false);
for(const key of ['signatureVerified','serverVerified','sourceVerified','quoteVerified','memberVerified']){
 const denied=evaluate({...base,[key]:false});
 assert.equal(denied.stage,'authentication',key);
 assert.equal(denied.grantEntitlement,false);
}
for(const changed of [
 {expectedMerchantId:'10000101'},
 {expectedOrder:{...base.expectedOrder,zarMinor:17891}},
 {expectedOrder:{...base.expectedOrder,plan:'unknown'}},
 {storedTransaction:undefined},
 {storedOrder:{id:'already-claimed'}},
 {raw:raw.replace('COMPLETE','PENDING')},
 {raw:raw+'&merchant_id=10000100'},
 {raw:raw.replace('178.90','0.00')}
]){
 const result=evaluate({...base,...changed});
 assert.equal(result.grantEntitlement,false);
 assert.notEqual(result.stage,'pending_atomic_commit');
}
console.log('PASS: composed sandbox ITN gates reconcile PayFast sub-cent precision to stored cents and remain fail closed');

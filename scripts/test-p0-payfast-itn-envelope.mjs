import assert from 'node:assert/strict';
import {parseSandboxItnEnvelope as parse} from '../functions/_lib/payfast-sandbox-itn-envelope.js';
const valid=new URLSearchParams({m_payment_id:'order_12345678',pf_payment_id:'provider_12345678',
 payment_status:'COMPLETE',amount_gross:'178.90',merchant_id:'10000100',signature:'a'.repeat(32)}).toString();
const type='application/x-www-form-urlencoded';
const result=parse(valid,type);
assert.equal(result.ok,true);
assert.equal(result.amountZarMinor,17890);
assert.equal(result.authenticated,false);
assert.equal(result.grantEntitlement,false);
for(const [raw,ct] of [
 [valid,'application/json'],['',type],['x'.repeat(16385),type],
 [valid+'&signature='+('b'.repeat(32)),type],
 [valid.replace('178.90','-1.00'),type],
 [valid.replace('178.90','1e3'),type],
 [valid.replace('178.90','178.999'),type],
 [valid.replace('10000100','not-a-merchant'),type],
 [valid.replace('provider_12345678','bad id'),type],
 [valid.replace('a'.repeat(32),'invalid-signature'),type],
 [valid.replace('COMPLETE','PENDING')+'&merchant_id=10000100',type],
 [valid+'&'+Array.from({length:65},(_,i)=>'x'+i+'=1').join('&'),type],
 [valid.replace('payment_status=COMPLETE','payment_status='),type]
]){
 assert.equal(parse(raw,ct).ok,false,'malformed/duplicate/oversize envelope must reject');
}
const pending=parse(valid.replace('COMPLETE','PENDING'),type);
assert.equal(pending.ok,true);
assert.equal(pending.authenticated,false);
assert.equal(pending.grantEntitlement,false);
console.log('PASS: bounded PayFast ITN parsing never authenticates or grants entitlements');

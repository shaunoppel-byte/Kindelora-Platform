import assert from 'node:assert/strict';
import {evaluateSandboxPayment} from '../functions/_lib/payfast-sandbox-payment-decision.js';
import {classifySandboxPaymentReplay as replay} from '../functions/_lib/payfast-sandbox-replay-state.js';
const input={environment:'sandbox',signatureVerified:true,merchantVerified:true,serverVerified:true,quoteVerified:true,
 memberVerified:true,transactionStatus:'COMPLETE',alreadyProcessed:false,providerTransactionId:'provider_12345678',
 merchantReference:'order_12345678',expectedMerchantReference:'order_12345678',paidCurrency:'ZAR',
 paidMinor:17890,expectedZarMinor:17890,plan:'monthly'};
const decision=evaluateSandboxPayment(input);
assert.equal(decision.accepted,true);
assert.deepEqual(replay({decision,storedTransaction:null,storedOrder:null}),
 {action:'new_pending_atomic_commit',grantEntitlement:false});
const stored={providerTransactionId:decision.providerTransactionId,merchantReference:decision.merchantReference,
 paidMinor:decision.paidMinor,plan:decision.plan,status:'COMPLETE'};
assert.deepEqual(replay({decision,storedTransaction:stored,storedOrder:null}),{action:'duplicate',grantEntitlement:false});
for(const bad of [
 {decision,storedTransaction:{...stored,paidMinor:1},storedOrder:null},
 {decision,storedTransaction:null,storedOrder:{id:'other'}},
 {decision,storedTransaction:{...stored,merchantReference:'other_order'},storedOrder:null}
])assert.deepEqual(replay(bad),{action:'conflict',grantEntitlement:false});
for(const bad of [{},{decision},{decision,storedTransaction:null},
 {decision:{...decision,accepted:false},storedTransaction:null,storedOrder:null}]){
 assert.deepEqual(replay(bad),{action:'reject',grantEntitlement:false});
}
console.log('PASS: replay decision never grants entitlement, rejects missing state and conflicting transaction/order');

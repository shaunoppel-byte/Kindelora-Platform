import assert from 'node:assert/strict';
import {evaluateSandboxPayment as decide} from '../functions/_lib/payfast-sandbox-payment-decision.js';
const good={environment:'sandbox',signatureVerified:true,merchantVerified:true,serverVerified:true,
 quoteVerified:true,memberVerified:true,transactionStatus:'COMPLETE',alreadyProcessed:false,
 providerTransactionId:'provider_12345678',merchantReference:'order_12345678',
 expectedMerchantReference:'order_12345678',paidCurrency:'ZAR',paidMinor:17890,
 expectedZarMinor:17890,plan:'monthly'};
const approved=decide(good);
assert.equal(approved.accepted,true);assert.equal(approved.grantEntitlement,true);
for(const [key,bad] of Object.entries({
 environment:'live',signatureVerified:false,merchantVerified:false,serverVerified:false,
 quoteVerified:false,memberVerified:false,transactionStatus:'PENDING',alreadyProcessed:true,
 providerTransactionId:'',merchantReference:'wrong_ref',expectedMerchantReference:'other_ref',
 paidCurrency:'USD',paidMinor:17889,expectedZarMinor:17891,plan:'premium'
})){
 const actual=decide({...good,[key]:bad});
 assert.deepEqual(actual,{accepted:false,grantEntitlement:false},'reject tampered '+key);
}
for(const bad of [null,undefined,{},[],{...good,paidMinor:NaN},{...good,paidMinor:17890.5},
 {...good,paidMinor:0},{...good,providerTransactionId:'bad id'},{...good,merchantReference:'bad id'},
 {...good,alreadyProcessed:null},{...good,signatureVerified:'true'},{...good,environment:'production'}]){
 assert.deepEqual(decide(bad),{accepted:false,grantEntitlement:false});
}
console.log('PASS: sandbox payment entitlement decision denies unverified, mismatched, replayed and malformed ITNs');

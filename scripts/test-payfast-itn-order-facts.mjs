import test from 'node:test';
import assert from 'node:assert/strict';
import {validateItnOrderFacts as check} from '../functions/_lib/payfast-itn-order-facts.js';
const expected={merchantId:'10000100',orderId:'kin_order_123',amountMinor:15499};
const valid={merchant_id:'10000100',m_payment_id:'kin_order_123',amount_gross:'154.99',payment_status:'COMPLETE',pf_payment_id:'123456789'};
test('matched ITN facts never constitute authentication',()=>{assert.deepEqual(check(valid,expected),{ok:true,reason:'order_facts_match_only',paymentReference:'123456789',authenticated:false});});
for(const [name,changes] of Object.entries({merchant:{merchant_id:'10000101'},order:{m_payment_id:'other'},amount:{amount_gross:'154.98'},format:{amount_gross:'154.990'},status:{payment_status:'FAILED'},reference:{pf_payment_id:'abc'}})){
 test('reject '+name,()=>assert.equal(check({...valid,...changes},expected).ok,false));
}
test('reject fractional precision tricks and non-string amount',()=>{for(const amount of ['154.9','0154.99','1e2','154.99 ','154,99',154.99])assert.equal(check({...valid,amount_gross:amount},expected).ok,false);});

test('reject missing and malformed trusted expected order facts',()=>{
 for(const trusted of [null,{}, {...expected,merchantId:'bad'}, {...expected,orderId:''}, {...expected,amountMinor:0}, {...expected,amountMinor:-1}, {...expected,amountMinor:15499.5}, {...expected,amountMinor:Number.MAX_SAFE_INTEGER+1}]){
  assert.equal(check(valid,trusted).ok,false);
 }
 assert.equal(check(null,expected).ok,false);
});
test('reject ambiguous payment status, references, and merchant types',()=>{
 for(const changes of [
  {payment_status:'PENDING'}, {payment_status:'COMPLETE '}, {payment_status:'complete'},
  {pf_payment_id:''}, {pf_payment_id:'0'.repeat(41)}, {pf_payment_id:123456789},
  {merchant_id:10000100}, {m_payment_id:123}, {amount_gross:'0.00'},
  {amount_gross:'999999999.99'}, {amount_gross:'154.98'}
 ]) assert.equal(check({...valid,...changes},expected).ok,false);
});

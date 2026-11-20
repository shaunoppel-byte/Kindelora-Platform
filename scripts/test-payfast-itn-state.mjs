import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateVerifiedPayfastEvent as decide} from '../functions/_lib/payfast-itn-state.mjs';
const order={id:'KIN-123',merchantId:'10000100',currency:'ZAR',amountMinor:15900,status:'pending'};
const event={id:'evt_1',orderId:'KIN-123',merchantId:'10000100',currency:'ZAR',amountMinor:15900,paymentStatus:'COMPLETE',signatureVerified:true,sourceVerified:true,serverVerified:true};
test('only fully authenticated, matching COMPLETE is eligible for paid transition',()=>{
 assert.deepEqual(decide(order,event),{action:'record_paid',reason:'verified_complete'});
});
test('missing any independent authentication rejects',()=>{
 for(const flag of ['signatureVerified','sourceVerified','serverVerified'])assert.equal(decide(order,{...event,[flag]:false}).action,'reject');
});
test('amount, currency, merchant and order mismatches reject',()=>{
 for(const [field,value] of [['amountMinor',15901],['currency','USD'],['merchantId','other'],['orderId','other']])assert.equal(decide(order,{...event,[field]:value}).reason,'order_mismatch');
});
test('replay ignored, terminal orders reject, unknown statuses reject',()=>{
 assert.equal(decide(order,event,['evt_1']).reason,'duplicate');
 assert.equal(decide({...order,status:'paid'},event).reason,'terminal_order');
 assert.equal(decide(order,{...event,paymentStatus:'PENDING'}).reason,'unknown_status');
});
test('verified failed/cancelled never grants paid entitlement',()=>{
 assert.equal(decide(order,{...event,paymentStatus:'FAILED'}).action,'record_failed');
 assert.equal(decide(order,{...event,paymentStatus:'CANCELLED'}).action,'record_cancelled');
});

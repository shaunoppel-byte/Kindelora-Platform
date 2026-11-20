import test from 'node:test';
import assert from 'node:assert/strict';
import {USD_PRICES,quote,applyVerifiedEvent,entitled} from '../functions/_lib/payfast-sandbox-domain.js';
const base=()=>({orderId:'ord_123',amountMinor:17000,status:'pending',periodEnd:null,seen:[]});
const event=(type,id='event_123456',periodEnd='2027-01-20T00:00:00.000Z')=>({type,id,orderId:'ord_123',currency:'ZAR',amountMinor:17000,periodEnd});
test('approved USD prices and verified external ZAR quote only',()=>{
 assert.deepEqual(USD_PRICES,{monthly:899,annual:8999});
 assert.equal(quote({plan:'annual',zarMinor:17000,rateReference:'fx_20261120'}).settlementMinor,17000);
 assert.throws(()=>quote({plan:'monthly',zarMinor:0,rateReference:'fx_20261120'}));
 assert.throws(()=>quote({plan:'monthly',zarMinor:17000,rateReference:''}));
});
test('unverified callback, mismatch and replay blocked',()=>{
 assert.throws(()=>applyVerifiedEvent(base(),event('COMPLETE')),/unauthenticated/);
 assert.throws(()=>applyVerifiedEvent(base(),{...event('COMPLETE'),amountMinor:1},{authenticated:true}),/settlement_mismatch/);
 assert.throws(()=>applyVerifiedEvent(base(),{...event('COMPLETE'),orderId:'other'},{authenticated:true}),/order_mismatch/);
 const active=applyVerifiedEvent(base(),event('COMPLETE'),{authenticated:true});
 assert.equal(active.status,'active');
 const replay=applyVerifiedEvent(active,event('COMPLETE'),{authenticated:true});
 assert.equal(replay.duplicate,true);assert.equal(replay.seen.length,1);
 assert.equal(entitled(active,'2026-12-20T00:00:00Z'),true);
 assert.equal(entitled(active,'2027-01-20T00:00:00Z'),false);
});
test('renewal, failed renewal, cancellation and refund transitions',()=>{
 const active=applyVerifiedEvent(base(),event('COMPLETE'),{authenticated:true});
 const late=applyVerifiedEvent(active,event('FAILED','event_234567'),{authenticated:true});
 assert.equal(late.status,'past_due');assert.equal(entitled(late,'2026-12-20T00:00:00Z'),false);
 const renewed=applyVerifiedEvent(late,event('RENEWED','event_345678','2027-02-20T00:00:00.000Z'),{authenticated:true});
 assert.equal(renewed.status,'active');
 assert.throws(()=>applyVerifiedEvent(renewed,event('RENEWED','event_456789'),{authenticated:true}),/non_increasing_period/);
 const cancelled=applyVerifiedEvent(renewed,event('CANCELLED','event_567890'),{authenticated:true});
 assert.equal(entitled(cancelled,'2027-01-01T00:00:00Z'),false);
 const refunded=applyVerifiedEvent(cancelled,event('REFUNDED','event_678901'),{authenticated:true});
 assert.equal(refunded.status,'refunded');assert.equal(entitled(refunded,'2027-01-01T00:00:00Z'),false);
 assert.throws(()=>applyVerifiedEvent(refunded,event('COMPLETE','event_789012'),{authenticated:true}),/invalid_transition/);
});

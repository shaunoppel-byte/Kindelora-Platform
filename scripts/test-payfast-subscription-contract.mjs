import test from 'node:test';
import assert from 'node:assert/strict';
import {subscriptionEntitled as entitled,renewalDecision as decide} from '../functions/_lib/payfast-subscription-contract.mjs';
const sub={id:'s1',customer_id:'c1',brand:'KIN',status:'active',current_period_end:'2026-12-20T00:00:00Z'};
const event={id:'evt_1',subscriptionId:'s1',customerId:'c1',brand:'KIN',signatureVerified:true,sourceVerified:true,serverVerified:true,paymentStatus:'COMPLETE',periodEnd:'2027-01-20T00:00:00Z'};
test('active and cancelled paid-through access expires at exact boundary',()=>{
 assert.equal(entitled(sub,'2026-12-19T23:59:59Z'),true);
 assert.equal(entitled({...sub,status:'cancelled'},'2026-12-19T23:59:59Z'),true);
 assert.equal(entitled({...sub,status:'cancelled'},sub.current_period_end),false);
 assert.equal(entitled({...sub,status:'past_due'},'2026-12-19T23:59:59Z'),false);
 assert.equal(entitled({...sub,status:'expired'},'2026-12-19T23:59:59Z'),false);
});
test('verified renewal extends period once',()=>{
 assert.equal(decide(sub,event).action,'record_renewal');
 assert.equal(decide(sub,event,['evt_1']).reason,'duplicate');
});
test('forged or mismatched renewal never grants access',()=>{
 for(const key of ['signatureVerified','sourceVerified','serverVerified'])assert.equal(decide(sub,{...event,[key]:false}).action,'reject');
 for(const [key,value] of [['customerId','other'],['brand','OTHER'],['subscriptionId','other']])assert.equal(decide(sub,{...event,[key]:value}).reason,'subscription_mismatch');
 assert.equal(decide(sub,{...event,paymentStatus:'FAILED'}).reason,'payment_not_complete');
 assert.equal(decide(sub,{...event,periodEnd:sub.current_period_end}).reason,'non_extending_period');
 assert.equal(decide({...sub,status:'cancelled'},event).reason,'not_renewable');
});

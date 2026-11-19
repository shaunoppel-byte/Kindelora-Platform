import assert from 'node:assert/strict';
import {preparePlusOrder,createOrderId} from '../functions/_lib/plus-order-policy.js';
const env={PAYFAST_CHECKOUT_ENABLED:'true',PAYFAST_RECURRING_VERIFIED:'true',PAYFAST_BILLING_CURRENCY:'ZAR',PAYFAST_PRICE_APPROVED:'true',PAYFAST_MONTHLY_AMOUNT_MINOR:'15900',PAYFAST_ANNUAL_AMOUNT_MINOR:'159900',DB:{prepare(){}}};
const id=createOrderId();assert.match(id,/^ord_[a-f0-9]{32}$/);assert.notEqual(createOrderId(),id);
const base={planId:'monthly',verifiedIdentitySubject:'member_123',orderId:id,env};
assert.deepEqual(preparePlusOrder(base),{ready:true,order:{id,identitySubject:'member_123',brand:'KIN',planId:'monthly',amountMinor:15900,currency:'ZAR',status:'pending'}});
assert.equal(preparePlusOrder({...base,planId:'annual'}).order.amountMinor,159900);
for(const bad of [{verifiedIdentitySubject:''},{verifiedIdentitySubject:'../../admin'},{orderId:'fake'},{planId:'other'},{env:{...env,PAYFAST_PRICE_APPROVED:'false'}},{env:{...env,PAYFAST_BILLING_CURRENCY:'USD',PAYFAST_PRICE_APPROVED:'false'}},{env:{...env,DB:null}}]){
 assert.equal(preparePlusOrder({...base,...bad}).ready,false,JSON.stringify(bad));
}
assert.equal(preparePlusOrder({...base,amountMinor:1,currency:'USD'}).order.amountMinor,15900);
console.log('PASS: server-only PLUS order policy rejects unauthenticated and unapproved checkout, ignores client pricing');

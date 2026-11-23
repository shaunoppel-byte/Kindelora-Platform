import assert from 'node:assert/strict';
import {verifyLivePlusD1Schema as verify} from '../functions/_lib/payfast-live-d1-schema-preflight.js';
const base={
 plus_customers:['id','identity_subject'],
 plus_orders:['id','customer_id','brand','amount_minor','currency','status','payment_reference'],
 plus_order_quotes:['order_id','plan_id','display_usd_minor','settlement_zar_minor','expires_at'],
 plus_payment_events:['id','order_id','provider','provider_event_reference','event_type'],
 plus_subscriptions:['id','customer_id','brand','status','current_period_end'],
 plus_payment_reconciliations:['order_id','payment_reference','verification_method','amount_minor','currency']
};
const recurring={
 plus_payfast_recurring_links:['initial_order_id','subscription_id','customer_id','plan_id','expected_zar_minor','provider_subscription_token'],
 plus_payfast_renewal_events:['provider_transaction_id','initial_order_id','subscription_id','paid_zar_minor','previous_period_end','new_period_end'],
 plus_payfast_renewal_atomic_guard:['singleton','expected_changes']
};
const db=columns=>({prepare(sql){const name=/^PRAGMA table_info\\(([^)]+)\\)$/.exec(sql)?.[1];assert.ok(name,'read-only schema query');return {async all(){return {results:(columns[name]||[]).map(name=>({name}))}}}}});
assert.equal((await verify({db:db(base)})).ready,true,'legacy schema accepted when recurring not required');
assert.equal((await verify({db:db(base),requireRecurring:true})).ready,false,'recurring missing must fail');
assert.equal((await verify({db:db({...base,...recurring}),requireRecurring:true})).ready,true,'complete recurring schema accepted');
for(const [table,fields] of Object.entries(recurring)){
 const missing={...base,...recurring,[table]:fields.slice(1)};
 assert.equal((await verify({db:db(missing),requireRecurring:true})).ready,false,'missing recurring column '+table);
}
assert.equal((await verify({db:{prepare(){throw Error('D1 unavailable')}},requireRecurring:true})).ready,false);
console.log('PASS: recurring schema preflight fails closed for missing tables, columns and D1 failure');

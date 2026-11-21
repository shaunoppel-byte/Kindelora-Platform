import assert from 'node:assert/strict';
import {inspectPaymentSchema} from '../functions/_lib/payfast-d1-schema-readiness.js';
let x=await inspectPaymentSchema(null);assert.equal(x.ready,false);
const tables={
 members:['id','email_verified_at','disabled_at'],
 member_sessions:['token_hash','member_id','expires_at'],
 payfast_sandbox_orders:['order_reference','member_id','plan','usd_minor','zar_minor','fx_reference','status','paid_at'],
 payfast_sandbox_transactions:['provider_transaction_id','order_reference','paid_zar_minor','status'],
 plus_customers:['id','identity_subject'],
 plus_subscriptions:['id','customer_id','brand','status','current_period_end']
};
const db={prepare(sql){const table=sql.match(/^PRAGMA table_info\(([a-z_]+)\)$/)?.[1];assert.ok(table);return {async all(){return {results:(tables[table]||[]).map(name=>({name}))}}}}};
x=await inspectPaymentSchema(db);assert.deepEqual(x,{ready:true,missing:[]});
delete tables.plus_subscriptions;
x=await inspectPaymentSchema(db);assert.equal(x.ready,false);assert.ok(x.missing.includes('plus_subscriptions'));
tables.plus_subscriptions=['id','customer_id','brand','status'];
x=await inspectPaymentSchema(db);assert.ok(x.missing.includes('plus_subscriptions.current_period_end'));
const broken={prepare(){return {async all(){throw Error('private DB details')}}}};
x=await inspectPaymentSchema(broken);assert.equal(x.ready,false);assert.ok(!JSON.stringify(x).includes('private DB details'));
console.log('PASS: D1 schema readiness checks all required tables/columns and fails closed');

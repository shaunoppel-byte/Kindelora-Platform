// Local SQLite integration test for the proposed renewal SQL. No PayFast or D1
// credentials, network requests, live charging, or production writes.
// Node 22: node --experimental-sqlite scripts/test-payfast-renewal-sqlite-atomicity.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {prepareAtomicPayFastRenewal} from '../functions/_lib/payfast-live-renewal-atomic-design.js';

const migration=name=>readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8');
const initialPeriod='2026-12-22T10:00:00.000Z';
const paidAt=initialPeriod;
const ids={orderId:'kin_order_12345678',customerId:'kin_customer_12345678',
 subscriptionId:'sub_1234567890123456',providerTransactionId:'pf_renewal_12345678',
 plan:'monthly',providerSubscriptionToken:'token_12345678',amountMinor:16500,previousPeriodEnd:initialPeriod};
function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec(migration('0001_plus_persistence.sql'));
 db.exec(migration('20261123_plus_payfast_recurring_linkage.sql'));
 db.exec(migration('20261123_plus_payfast_renewal_atomic_guard.sql'));
 db.prepare('INSERT INTO plus_customers(id,identity_subject) VALUES (?,?)').run(ids.customerId,'subject_123');
 db.prepare('INSERT INTO plus_orders(id,customer_id,brand,amount_minor,currency,status) VALUES (?, ?, ?, ?, ?, ?)').run(ids.orderId,ids.customerId,'KIN',ids.amountMinor,'ZAR','paid');
 db.prepare('INSERT INTO plus_subscriptions(id,customer_id,brand,status,current_period_end) VALUES (?, ?, ?, ?, ?)').run(ids.subscriptionId,ids.customerId,'KIN','active',initialPeriod);
 db.prepare('INSERT INTO plus_payfast_recurring_links(initial_order_id,subscription_id,customer_id,plan_id,expected_zar_minor,provider_subscription_token) VALUES (?,?,?,?,?,?)').run(ids.orderId,ids.subscriptionId,ids.customerId,'monthly',ids.amountMinor,'token_12345678');
 return db;
}
function design(db,renewal=ids){
 const adapter={prepare(sql){return {bind(...args){return {sql,args}}}}};
 const plan=prepareAtomicPayFastRenewal({db:adapter,
  verifiedRenewal:{ready:true,execute:false,grantEntitlement:false,renewal},
  paidAt});
 assert.equal(plan.ready,false);
 assert.equal(plan.execute,false);
 assert.deepEqual(plan.statements,[]);
 assert.equal(plan.proposedStatements.length,6);
 return plan;
}
function simulateBatch(db,statements){
 db.exec('BEGIN');
 try{
  for(const stmt of statements)db.prepare(stmt.sql).run(...stmt.args);
  db.exec('COMMIT');
  return true;
 }catch(error){
  db.exec('ROLLBACK');
  if(process.env.PAYFAST_RENEWAL_SQL_DEBUG==='1') console.error('SQLite renewal transaction rejected:',error.message);
  return false;
 }
}
function state(db){
 return {
  period:db.prepare('SELECT current_period_end FROM plus_subscriptions WHERE id=?').get(ids.subscriptionId).current_period_end,
  renewals:db.prepare('SELECT count(*) AS n FROM plus_payfast_renewal_events').get().n,
  guard:db.prepare('SELECT count(*) AS n FROM plus_payfast_renewal_atomic_guard').get().n
 };
}
{
 const db=fixture();
 assert.equal(simulateBatch(db,design(db).proposedStatements),true,'valid renewal must commit');
 assert.deepEqual(state(db),{period:'2027-01-22T10:00:00.000Z',renewals:1,guard:0});
 assert.equal(simulateBatch(db,design(db).proposedStatements),false,'duplicate provider event must roll back');
 assert.deepEqual(state(db),{period:'2027-01-22T10:00:00.000Z',renewals:1,guard:0});
 db.close();
}
for(const [label,modify] of [
 ['missing provider token',db=>db.exec('UPDATE plus_payfast_recurring_links SET provider_subscription_token=NULL')],
 ['original order pending',db=>db.exec("UPDATE plus_orders SET status='pending'")],
 ['subscription cancelled',db=>db.exec("UPDATE plus_subscriptions SET status='cancelled'")],
 ['changed period',db=>db.exec("UPDATE plus_subscriptions SET current_period_end='2026-12-23T10:00:00.000Z'")],
 ['wrong settlement amount',db=>db.exec('UPDATE plus_payfast_recurring_links SET expected_zar_minor=999')],
 ['wrong provider subscription token',db=>db.exec("UPDATE plus_payfast_recurring_links SET provider_subscription_token='different_token_12345678'")],
 ['provider reference used by initial payment',db=>db.prepare('INSERT INTO plus_payment_events(id,order_id,provider,provider_event_reference,event_type,verified_at) VALUES (?,?,?,?,?,?)').run('initial_event_12345678',ids.orderId,'PayFast',ids.providerTransactionId,'COMPLETE',paidAt)]
]){
 const db=fixture();
 modify(db);
 const before=state(db);
 assert.equal(simulateBatch(db,design(db).proposedStatements),false,label);
 assert.deepEqual(state(db),before,label+' must roll back without ledger or entitlement changes');
 db.close();
}
console.log('PASS: SQLite atomic renewal, replay and seven rollback scenarios (staging D1 verification still required)');

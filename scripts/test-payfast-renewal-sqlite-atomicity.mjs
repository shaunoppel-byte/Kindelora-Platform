// Local SQLite integration test for the proposed renewal SQL. No PayFast or D1
// credentials, network requests, live charging, or production writes.
// Node 22: node --experimental-sqlite scripts/test-payfast-renewal-sqlite-atomicity.mjs
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {prepareAtomicPayFastRenewal} from '../functions/_lib/payfast-live-renewal-atomic-design.js';

const migration=name=>readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8');
const initialPeriod='2026-12-22T10:00:00.000Z';
const paidAt=initialPeriod;
const ids={orderId:'kin_order_12345678',customerId:'kin_customer_12345678',
 subscriptionId:'sub_1234567890123456',providerTransactionId:'pf_renewal_12345678',
 plan:'monthly',providerSubscriptionToken:'token_12345678',amountMinor:16500,previousPeriodEnd:initialPeriod};
function fixture(filename=':memory:'){
 const db=new DatabaseSync(filename);
 db.exec(migration('0001_plus_persistence.sql'));
 db.exec(migration('20261123_plus_payfast_recurring_linkage.sql'));
 db.exec(migration('20261123_plus_payfast_renewal_atomic_guard.sql'));
 db.prepare('INSERT INTO plus_customers(id,identity_subject) VALUES (?,?)').run(ids.customerId,'subject_123');
 db.prepare('INSERT INTO plus_orders(id,customer_id,brand,amount_minor,currency,status) VALUES (?, ?, ?, ?, ?, ?)').run(ids.orderId,ids.customerId,'KIN',ids.amountMinor,'ZAR','paid');
 db.prepare('INSERT INTO plus_subscriptions(id,customer_id,brand,status,current_period_end) VALUES (?, ?, ?, ?, ?)').run(ids.subscriptionId,ids.customerId,'KIN','active',initialPeriod);
 db.prepare('INSERT INTO plus_payfast_recurring_links(initial_order_id,subscription_id,customer_id,plan_id,expected_zar_minor,provider_subscription_token) VALUES (?,?,?,?,?,?)').run(ids.orderId,ids.subscriptionId,ids.customerId,'monthly',ids.amountMinor,'token_12345678');
 return db;
}
function design(db,renewal=ids,cyclePaidAt=paidAt){
 const adapter={prepare(sql){return {sql,args:[],bind(...args){return {sql,args}}}}};
 const plan=prepareAtomicPayFastRenewal({db:adapter,
  verifiedRenewal:{ready:true,execute:false,grantEntitlement:false,renewal},
  paidAt:cyclePaidAt});
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
 const second={...ids,providerTransactionId:'pf_renewal_second_1234',previousPeriodEnd:'2027-01-22T10:00:00.000Z'};
 const secondPlan=design(db,second,second.previousPeriodEnd);
 assert.equal(simulateBatch(db,secondPlan.proposedStatements),true,'a distinct next-cycle provider event must extend the next period');
 assert.deepEqual(state(db),{period:'2027-02-22T10:00:00.000Z',renewals:2,guard:0});
 assert.equal(simulateBatch(db,secondPlan.proposedStatements),false,'duplicate second-cycle provider event must roll back');
 assert.deepEqual(state(db),{period:'2027-02-22T10:00:00.000Z',renewals:2,guard:0});
 db.close();
}
for(const [label,modify] of [
 ['missing provider token',db=>db.exec('UPDATE plus_payfast_recurring_links SET provider_subscription_token=NULL')],
 ['original order pending',db=>db.exec("UPDATE plus_orders SET status='pending'")],
 ['original order reassigned',db=>{db.prepare('INSERT INTO plus_customers(id,identity_subject) VALUES (?,?)').run('other_customer_12345678','other_subject_123');db.exec("UPDATE plus_orders SET customer_id='other_customer_12345678'")}],
 ['subscription reassigned',db=>{db.prepare('INSERT INTO plus_customers(id,identity_subject) VALUES (?,?)').run('other_customer_12345678','other_subject_123');db.exec("UPDATE plus_subscriptions SET customer_id='other_customer_12345678'")}],
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

{
 const db=fixture(),before=state(db);
 const wrongAmount=design(db,{...ids,amountMinor:16501});
 assert.equal(simulateBatch(db,wrongAmount.proposedStatements),false,'wrong renewal amount must abort the SQL batch');
 assert.deepEqual(state(db),before,'wrong amount must leave the period and renewal ledger unchanged');
 db.close();
}

// Two independent SQLite connections model competing D1 batch transactions
// against one database file. A write lock serializes the race; after the
// winner commits, retrying the provider event must fail as a replay.
{
 const directory=mkdtempSync(join(tmpdir(),'kindelora-renewal-race-'));
 const filename=join(directory,'staging.sqlite');
 const first=fixture(filename),second=new DatabaseSync(filename);
 first.exec('PRAGMA busy_timeout=0');
 second.exec('PRAGMA busy_timeout=0');
 const statements=design(first).proposedStatements;
 const competingStatements=design(second,{...ids,providerTransactionId:'pf_competing_12345678'}).proposedStatements;
 first.exec('BEGIN IMMEDIATE');
 try{for(const stmt of statements)first.prepare(stmt.sql).run(...stmt.args)}
 catch(error){first.exec('ROLLBACK');first.close();second.close();rmSync(directory,{recursive:true,force:true});throw error}
 assert.throws(()=>second.exec('BEGIN IMMEDIATE'),/locked/i,'competing renewal must fail to acquire the write lock while the first batch is open');
 first.exec('COMMIT');
 assert.equal(simulateBatch(second,statements),false,'concurrent duplicate retry must be rejected');
 assert.equal(simulateBatch(second,competingStatements),false,'a competing distinct event based on the stale period must be rejected');
 assert.deepEqual(state(first),{period:'2027-01-22T10:00:00.000Z',renewals:1,guard:0});
 first.close();second.close();rmSync(directory,{recursive:true,force:true});
}
console.log('PASS: SQLite atomic renewal, second cycle, replay, concurrent duplicate, ten rollback cases (Cloudflare D1 staging verification still required)');

import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {prepareAtomicPayFastRenewal} from '../functions/_lib/payfast-live-renewal-atomic-design.js';
for(const plan of ['monthly','annual']){
 const db=new DatabaseSync(':memory:');
 db.exec(`
 CREATE TABLE plus_orders(id TEXT PRIMARY KEY,customer_id TEXT,status TEXT,amount_minor INTEGER,currency TEXT);
 CREATE TABLE plus_subscriptions(id TEXT PRIMARY KEY,customer_id TEXT,brand TEXT,status TEXT,current_period_end TEXT,updated_at TEXT);
 CREATE TABLE plus_payfast_recurring_links(initial_order_id TEXT,subscription_id TEXT,customer_id TEXT,plan_id TEXT,expected_zar_minor INTEGER,provider_subscription_token TEXT);
 CREATE TABLE plus_payfast_renewal_events(provider_transaction_id TEXT PRIMARY KEY,initial_order_id TEXT,subscription_id TEXT,paid_zar_minor INTEGER,status TEXT,previous_period_end TEXT,new_period_end TEXT,verified_at TEXT);
 CREATE TABLE plus_payment_events(provider_event_reference TEXT);
 CREATE TABLE plus_payfast_renewal_atomic_guard(singleton INTEGER PRIMARY KEY CHECK(singleton=1),expected_changes INTEGER NOT NULL CHECK(expected_changes=1));
 `);
 const previousPeriodEnd='2026-12-01T00:00:00.000Z', paidAt='2026-11-30T00:00:00.000Z';
 const amountMinor=plan==='monthly'?15909:159254;
 db.prepare('INSERT INTO plus_orders VALUES (?,?,?,?,?)').run('order0001','customer01','paid',amountMinor,'ZAR');
 db.prepare('INSERT INTO plus_subscriptions VALUES (?,?,?,?,?,NULL)').run('subscription01','customer01','KIN','active',previousPeriodEnd);
 db.prepare('INSERT INTO plus_payfast_recurring_links VALUES (?,?,?,?,?,?)').run('order0001','subscription01','customer01',plan,amountMinor,'token0001');
 const adapter={prepare(sql){return {sql,args:[],bind(...args){return {sql,args}}}}};
 const compose=(id)=>prepareAtomicPayFastRenewal({db:adapter,paidAt,verifiedRenewal:{ready:true,execute:false,grantEntitlement:false,renewal:{orderId:'order0001',customerId:'customer01',subscriptionId:'subscription01',providerTransactionId:id,providerSubscriptionToken:'token0001',plan,amountMinor,previousPeriodEnd}}});
 const batch=p=>{db.exec('BEGIN');try{for(const s of p.proposedStatements)db.prepare(s.sql).run(...s.args);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}};
 const p=compose('payment001');assert.equal(p.proposedStatements.length,6);
 const expected=plan==='monthly'?'2027-01-01T00:00:00.000Z':'2027-12-01T00:00:00.000Z';
 assert.equal(p.periodEnd,expected);
 db.exec("UPDATE plus_subscriptions SET brand='OTHER'");
 assert.throws(()=>batch(p),/CHECK constraint failed/);
 assert.equal(db.prepare('SELECT count(*) n FROM plus_payfast_renewal_events').get().n,0);
 assert.equal(db.prepare('SELECT current_period_end FROM plus_subscriptions').get().current_period_end,previousPeriodEnd);
 db.exec("UPDATE plus_subscriptions SET brand='KIN'");
 batch(p);
 assert.equal(db.prepare('SELECT current_period_end FROM plus_subscriptions').get().current_period_end,expected);
 assert.throws(()=>batch(p),/CHECK constraint failed/);
 assert.throws(()=>batch(compose('payment002')),/CHECK constraint failed/);
 assert.equal(db.prepare('SELECT count(*) n FROM plus_payfast_renewal_events').get().n,1);
 assert.equal(db.prepare('SELECT count(*) n FROM plus_payfast_renewal_atomic_guard').get().n,0);
 db.close();console.log(plan+' renewal, rollback, replay and stale period passed');
}

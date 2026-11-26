import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/plus/schema-readiness.js';
const req=new Request('https://kindelora.pages.dev/api/plus/schema-readiness',{headers:{cookie:'kindelora_session='+'a'.repeat(64)}});
const tables={
 members:['id','email_verified_at','disabled_at'],
 member_sessions:['token_hash','member_id','expires_at'],
 payfast_sandbox_orders:['order_reference','member_id','plan','usd_minor','zar_minor','fx_reference','status','paid_at'],
 payfast_sandbox_transactions:['provider_transaction_id','order_reference','paid_zar_minor','status'],
 plus_customers:['id','identity_subject'],
 plus_subscriptions:['id','customer_id','brand','status','current_period_end'],
 plus_orders:['id','customer_id','brand','amount_minor','currency','status','payment_reference'],
 plus_order_quotes:['order_id','plan_id','display_usd_minor','settlement_zar_minor','expires_at'],
 plus_payment_events:['id','order_id','provider','provider_event_reference','event_type'],
 plus_payment_reconciliations:['order_id','payment_reference','verification_method','amount_minor','currency']
};
const db={prepare(sql){
 if(sql.includes('FROM member_sessions'))return {bind(){return {async first(){return {id:'member_12345678'}}}}};
 if(sql.startsWith('SELECT sql FROM sqlite_master'))return {async first(){return {sql:'CREATE TABLE guard(singleton INTEGER PRIMARY KEY CHECK(singleton=1),expected_changes INTEGER NOT NULL CHECK(expected_changes=1))'}}};
 const table=sql.match(/^PRAGMA table_info\(([a-z_]+)\)$/)?.[1];assert.ok(table);
 return {async all(){return {results:(tables[table]||[]).map(name=>({name,pk:(table==='plus_payfast_renewal_atomic_guard'&&name==='singleton'||table==='plus_payfast_renewal_events'&&name==='provider_transaction_id')?1:0,notnull:name==='expected_changes'?1:0}))}}};
}};
const env={MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'p'.repeat(40),DB:db};
let r=await onRequestGet({request:new Request(req.url),env});assert.equal(r.status,401);
r=await onRequestGet({request:req,env});assert.equal(r.status,200);assert.deepEqual(await r.json(),{ready:true,reason:'schema_present',liveSchemaReady:true,liveSchemaReason:'required_plus_schema_present',checkoutReady:false,productionPrerequisitesReady:false,releaseFlagsReady:false,merchantConfigured:false,atomicSchemaReady:false,recurringSchemaReady:false});
delete tables.plus_payment_reconciliations;
r=await onRequestGet({request:req,env});assert.equal(r.status,503);
assert.deepEqual(await r.json(),{ready:true,reason:'schema_present',liveSchemaReady:false,liveSchemaReason:'schema_unavailable',checkoutReady:false,productionPrerequisitesReady:false,releaseFlagsReady:false,merchantConfigured:false,atomicSchemaReady:false,recurringSchemaReady:false});
tables.plus_payment_reconciliations=['order_id','payment_reference','verification_method','amount_minor','currency'];
delete tables.plus_subscriptions;
r=await onRequestGet({request:req,env});assert.equal(r.status,503);
const body=await r.text();assert.ok(!body.includes('plus_subscriptions'));assert.ok(!body.includes('member_12345678'));
r=await onRequestGet({request:req,env:{...env,MEMBER_AUTH_ENABLED:'false'}});assert.equal(r.status,503);
console.log('PASS: authenticated D1 schema readiness hides table names, denies anonymous, never enables checkout');

tables.plus_subscriptions=['id','customer_id','brand','status','current_period_end'];
tables.plus_payfast_recurring_links=['initial_order_id','subscription_id','customer_id','plan_id','expected_zar_minor','provider_subscription_token'];
tables.plus_payfast_renewal_events=['provider_transaction_id','initial_order_id','subscription_id','paid_zar_minor','previous_period_end','new_period_end'];
tables.plus_payfast_renewal_atomic_guard=['singleton','expected_changes'];
const configured={...env,PAYFAST_LIVE_MERCHANT_ID:'12345678',PAYFAST_LIVE_MERCHANT_KEY:'test-key',PAYFAST_LIVE_PASSPHRASE:'test-passphrase',PAYFAST_LIVE_ALLOWED_CIDRS:'192.0.2.0/24'};
for(const key of ['KINDELORA_PLUS_CHECKOUT_RELEASE_APPROVED','PAYFAST_LIVE_CHECKOUT_ENABLED','PAYFAST_LIVE_ITN_ENABLED','PAYFAST_LIVE_RECURRING_VERIFIED','PAYFAST_LIVE_INITIAL_RECURRING_LINK_ENABLED','PAYFAST_LIVE_RENEWAL_ITN_ENABLED'])configured[key]='true';
r=await onRequestGet({request:req,env:configured});const positive=await r.json();assert.equal(positive.productionPrerequisitesReady,true);assert.equal(positive.checkoutReady,false);assert.ok(!JSON.stringify(positive).includes('test-passphrase'));
r=await onRequestGet({request:req,env:{...configured,PAYFAST_LIVE_ITN_ENABLED:'false'}});assert.equal((await r.json()).productionPrerequisitesReady,false);
delete tables.plus_payfast_recurring_links;
r=await onRequestGet({request:req,env:configured});assert.equal((await r.json()).productionPrerequisitesReady,false);

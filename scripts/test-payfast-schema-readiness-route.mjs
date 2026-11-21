import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/plus/schema-readiness.js';
const req=new Request('https://kindelora.pages.dev/api/plus/schema-readiness',{headers:{cookie:'kindelora_session='+'a'.repeat(64)}});
const tables={
 members:['id','email_verified_at','disabled_at'],
 member_sessions:['token_hash','member_id','expires_at'],
 payfast_sandbox_orders:['order_reference','member_id','plan','usd_minor','zar_minor','fx_reference','status','paid_at'],
 payfast_sandbox_transactions:['provider_transaction_id','order_reference','paid_zar_minor','status'],
 plus_customers:['id','identity_subject'],
 plus_subscriptions:['id','customer_id','brand','status','current_period_end']
};
const db={prepare(sql){
 if(sql.includes('FROM member_sessions'))return {bind(){return {async first(){return {id:'member_12345678'}}}}};
 const table=sql.match(/^PRAGMA table_info\(([a-z_]+)\)$/)?.[1];assert.ok(table);
 return {async all(){return {results:(tables[table]||[]).map(name=>({name}))}}};
}};
const env={MEMBER_AUTH_ENABLED:'true',MEMBER_AUTH_PEPPER:'p'.repeat(40),DB:db};
let r=await onRequestGet({request:new Request(req.url),env});assert.equal(r.status,401);
r=await onRequestGet({request:req,env});assert.equal(r.status,200);assert.deepEqual(await r.json(),{ready:true,reason:'schema_present',checkoutReady:false});
delete tables.plus_subscriptions;
r=await onRequestGet({request:req,env});assert.equal(r.status,503);
const body=await r.text();assert.ok(!body.includes('plus_subscriptions'));assert.ok(!body.includes('member_12345678'));
r=await onRequestGet({request:req,env:{...env,MEMBER_AUTH_ENABLED:'false'}});assert.equal(r.status,503);
console.log('PASS: authenticated D1 schema readiness hides table names, denies anonymous, never enables checkout');

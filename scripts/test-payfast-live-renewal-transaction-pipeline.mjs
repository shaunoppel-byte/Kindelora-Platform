import assert from 'node:assert/strict';
import {md5} from '../functions/_lib/payfast-md5.js';
import {processAuthenticatedLivePayFastRenewal as process} from '../functions/_lib/payfast-live-renewal-transaction-pipeline.js';

const passphrase='server-only-passphrase';
const fields='m_payment_id=order_12345678&pf_payment_id=provider_12345678&payment_status=COMPLETE&amount_gross=165.00&merchant_id=10000100&token=recurring_token_12345678';
const raw=fields+'&signature='+md5(fields+'&passphrase='+passphrase);
const request={headers:{get(key){return key==='content-type'?'application/x-www-form-urlencoded':'192.0.2.12'}}};
const link={initial_order_id:'order_12345678',subscription_id:'subscription_12345678',
 customer_id:'customer_12345678',plan_id:'monthly',expected_zar_minor:16500,
 provider_subscription_token:'recurring_token_12345678'};
const order={id:link.initial_order_id,status:'paid',customer_id:link.customer_id,amount_minor:16500,currency:'ZAR'};
const subscription={id:link.subscription_id,customer_id:link.customer_id,status:'active',current_period_end:'2026-12-22T10:00:00.000Z'};
let batches=0;
const db={
 prepare(sql){return {bind(){return {async first(){
  if(sql.includes('FROM plus_payfast_recurring_links'))return link;
  if(sql.includes('FROM plus_payfast_renewal_events'))return null;
  if(sql.includes('FROM plus_payment_events'))return null;
  if(sql.includes('FROM plus_orders'))return order;
  if(sql.includes('FROM plus_subscriptions'))return subscription;
  throw Error('unexpected SQL: '+sql);
 }}}}},
 async batch(){batches++;throw Error('design-only renewal statements must not execute');}
};

const result=await process({db,request,raw,merchantId:'10000100',passphrase,
 allowedCidrs:'192.0.2.0/24',fetchImpl:async(url,options)=>{
  assert.equal(url,'https://www.payfast.co.za/eng/query/validate');
  assert.equal(options.method,'POST');
  return {status:200,ok:true,async text(){return 'VALID'}};
 },nowMs:1795348800000});

assert.equal(result.committed,false);
assert.equal(result.reason,'renewal_atomic_plan_unavailable');
assert.equal(result.grantEntitlement,false);
assert.equal(batches,0,'D1 batch must not run until the composer explicitly reports ready:true');
console.log('PASS: live renewal pipeline fails closed on a not-ready atomic plan; no D1 batch or entitlement grant');

 // Positive authenticated pipeline contract, using a synthetic D1 adapter.
 let positiveBatches=0;
 const originalPrepare=db.prepare.bind(db);
 db.prepare=function(sql){
 if(sql==='PRAGMA table_info(plus_payfast_renewal_atomic_guard)')return {async all(){return {results:[{name:'singleton',pk:1},{name:'expected_changes',notnull:1}]}}};
 if(sql==='PRAGMA table_info(plus_payfast_renewal_events)')return {async all(){return {results:[{name:'provider_transaction_id',pk:1}]}}};
 if(sql.includes('FROM sqlite_master'))return {async first(){return {sql:'CREATE TABLE plus_payfast_renewal_atomic_guard(singleton INTEGER PRIMARY KEY CHECK(singleton=1),expected_changes INTEGER NOT NULL CHECK(expected_changes=1))'}}};
 return originalPrepare(sql);
 };
 db.batch=async statements=>{positiveBatches++;assert.equal(statements.length,6);return statements.map(()=>({success:true,meta:{changes:1}}))};
 const args={db,request,raw,merchantId:'10000100',passphrase,allowedCidrs:'192.0.2.0/24',fetchImpl:async()=>({status:200,ok:true,async text(){return 'VALID'}}),nowMs:1795348800000};
 const accepted=await process(args);
 assert.equal(accepted.committed,true);
 assert.equal(accepted.reason,'authenticated_renewal_recorded');
 assert.equal(accepted.grantEntitlement,false);
 assert.equal(positiveBatches,1);
 const rejected=await process({...args,raw:raw.replace('165.00','166.00')});
 assert.equal(rejected.committed,false);
 assert.equal(positiveBatches,1);
 db.batch=async()=>{throw Error('synthetic transaction failure')};
 assert.equal((await process(args)).committed,false);
 console.log('PASS: authenticated renewal reaches six-statement batch only after verified schema; tampering and batch failure rejected');

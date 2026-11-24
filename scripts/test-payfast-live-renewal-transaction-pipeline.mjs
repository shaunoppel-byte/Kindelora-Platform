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

import assert from 'node:assert/strict';
import {md5} from '../functions/_lib/payfast-md5.js';
import {onRequestPost} from '../functions/api/plus/payfast-live-itn.js';

const columns={
 plus_customers:['id','identity_subject'],
 plus_orders:['id','customer_id','brand','amount_minor','currency','status','payment_reference'],
 plus_order_quotes:['order_id','plan_id','display_usd_minor','settlement_zar_minor','expires_at'],
 plus_payment_events:['id','order_id','provider','provider_event_reference','event_type'],
 plus_subscriptions:['id','customer_id','brand','status','current_period_end'],
 plus_payment_reconciliations:['order_id','payment_reference','verification_method','amount_minor','currency'],
 plus_payfast_recurring_links:['initial_order_id','subscription_id','customer_id','plan_id','expected_zar_minor','provider_subscription_token'],
 plus_payfast_renewal_events:['provider_transaction_id','initial_order_id','subscription_id','paid_zar_minor','previous_period_end','new_period_end'],
 plus_payfast_renewal_atomic_guard:['singleton','expected_changes']
};
const order={id:'order_12345678',status:'paid',customer_id:'customer_12345678',amount_minor:16500,currency:'ZAR'};
const link={initial_order_id:order.id,subscription_id:'subscription_12345678',customer_id:order.customer_id,
 plan_id:'monthly',expected_zar_minor:16500,provider_subscription_token:'recurring_token_12345678'};
const subscription={id:link.subscription_id,customer_id:link.customer_id,status:'active',current_period_end:'2026-12-22T10:00:00.000Z'};
let batches=0;
const db={
 prepare(sql){
  const query={
   async first(){
     if(sql.includes('SELECT status FROM plus_orders'))return order;
     if(sql.includes('FROM plus_payfast_recurring_links'))return link;
     if(sql.includes('FROM plus_payfast_renewal_events'))return null;
     if(sql.includes('FROM plus_payment_events'))return null;
     if(sql.includes('FROM plus_orders'))return order;
     if(sql.includes('FROM plus_subscriptions'))return subscription;
     throw Error('unexpected SQL: '+sql+' '+JSON.stringify(query.args||[]));
   },
   async all(){
     if(!sql.startsWith('PRAGMA table_info('))throw Error('unexpected all query');
     const table=sql.slice('PRAGMA table_info('.length,-1);
     return {results:(columns[table]||[]).map(name=>({name}))};
   },
   bind(...args){query.args=args;return query;}
  };
  return query;
 },
 async batch(){batches++;throw Error('design-only renewal plan must not reach D1 batch');}
};
const passphrase='server-only-passphrase';
const fields='m_payment_id='+order.id+'&pf_payment_id=provider_12345678&payment_status=COMPLETE&amount_gross=165.00&merchant_id=10000100&token='+link.provider_subscription_token;
const raw=fields+'&signature='+md5(fields+'&passphrase='+passphrase);
const request={headers:{get(name){return ({'content-type':'application/x-www-form-urlencoded','content-length':String(raw.length),'cf-connecting-ip':'192.0.2.12'})[name.toLowerCase()]||null;}},async text(){return raw;}};
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>({status:200,ok:true,async text(){return 'VALID'}});
try{
 const response=await onRequestPost({request,env:{DB:db,PAYFAST_LIVE_ITN_ENABLED:'true',
  PAYFAST_LIVE_RENEWAL_ITN_ENABLED:'true',PAYFAST_LIVE_MERCHANT_ID:'10000100',
  PAYFAST_LIVE_PASSPHRASE:passphrase,PAYFAST_LIVE_ALLOWED_CIDRS:'192.0.2.0/24'}});
 const body=await response.json();
 assert.equal(response.status,503);
 assert.equal(body.reason,'renewal_recording_unavailable');
 assert.equal(body.grantEntitlement,false);
 assert.equal(batches,0,'unready renewal plan must not execute D1 batch');
}finally{globalThis.fetch=originalFetch;}
console.log('PASS: live ITN route returns retryable 503 for design-only renewal plan without writing D1');

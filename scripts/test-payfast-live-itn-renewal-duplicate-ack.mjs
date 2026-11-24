import assert from 'node:assert/strict';
import {md5} from '../functions/_lib/payfast-md5.js';
import {onRequestPost} from '../functions/api/plus/payfast-live-itn.js';

const passphrase='server-only-passphrase';
const order={id:'order_12345678',status:'paid',customer_id:'customer_12345678',amount_minor:16500,currency:'ZAR'};
const link={initial_order_id:order.id,subscription_id:'subscription_12345678',
 customer_id:order.customer_id,plan_id:'monthly',expected_zar_minor:16500,
 provider_subscription_token:'recurring_token_12345678'};
const committed={provider_transaction_id:'provider_12345678',initial_order_id:order.id,
 subscription_id:link.subscription_id,paid_zar_minor:16500,status:'committed'};
const columns={
 plus_customers:['id','identity_subject'],
 plus_orders:['id','customer_id','brand','amount_minor','currency','status','payment_reference'],
 plus_order_quotes:['order_id','plan_id','display_usd_minor','settlement_zar_minor','expires_at'],
 plus_payment_events:['id','order_id','provider','provider_event_reference','event_type'],
 plus_subscriptions:['id','customer_id','brand','status','current_period_end'],
 plus_payment_reconciliations:['order_id','payment_reference','verification_method','amount_minor','currency'],
 plus_payfast_recurring_links:['initial_order_id','subscription_id','customer_id','plan_id','expected_zar_minor','provider_subscription_token'],
 plus_payfast_renewal_events:['provider_transaction_id','initial_order_id','subscription_id','paid_zar_minor','previous_period_end','new_period_end','status'],
 plus_payfast_renewal_atomic_guard:['singleton','expected_changes']
};
function fakeDb({prior=committed,linkRow=link}={}){
 let batches=0,writes=0;
 const db={
  prepare(sql){
   const query={
    bind(...args){query.args=args;return query;},
    async first(){
     if(sql.includes('SELECT status FROM plus_orders'))return order;
     if(sql.includes('FROM plus_payfast_recurring_links'))return linkRow;
     if(sql.includes('FROM plus_payfast_renewal_events'))return prior;
     if(sql.includes('FROM plus_payment_events'))return null;
     if(sql.includes('FROM plus_orders'))return order;
     throw Error('unexpected SQL: '+sql+' '+JSON.stringify(query.args||[]));
    },
    async all(){
     if(!sql.startsWith('PRAGMA table_info('))throw Error('unexpected all query: '+sql);
     const table=sql.slice('PRAGMA table_info('.length,-1);
     return {results:(columns[table]||[]).map(name=>({name}))};
    }
   };
   return query;
  },
  async batch(){batches++;writes++;throw Error('duplicate acknowledgment must not write');}
 };
 return {db,get batches(){return batches;},get writes(){return writes;}};
}
function requestFor({amount='165.00',token=link.provider_subscription_token}={}){
 const fields='m_payment_id='+order.id+'&pf_payment_id=provider_12345678&payment_status=COMPLETE&amount_gross='+amount+'&merchant_id=10000100&token='+token;
 const raw=fields+'&signature='+md5(fields+'&passphrase='+passphrase);
 return {raw,request:{headers:{get(name){return ({'content-type':'application/x-www-form-urlencoded',
   'content-length':String(raw.length),'cf-connecting-ip':'192.0.2.12'})[name.toLowerCase()]||null;}},async text(){return raw;}}};
}
const env={PAYFAST_LIVE_ITN_ENABLED:'true',PAYFAST_LIVE_RENEWAL_ITN_ENABLED:'true',
 PAYFAST_LIVE_MERCHANT_ID:'10000100',PAYFAST_LIVE_PASSPHRASE:passphrase,
 PAYFAST_LIVE_ALLOWED_CIDRS:'192.0.2.0/24'};
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>({status:200,ok:true,async text(){return 'VALID'}});
try{
 const validDb=fakeDb();
 const validRequest=requestFor();
 const accepted=await onRequestPost({request:validRequest.request,env:{...env,DB:validDb.db}});
 const body=await accepted.json();
 assert.equal(accepted.status,200,'exact authenticated committed duplicate should stop PayFast retries');
 assert.equal(body.reason,'verified_renewal_duplicate_acknowledged');
 assert.equal(body.grantEntitlement,false);
 assert.equal(validDb.batches,0,'duplicate acknowledgement must not execute a D1 batch');
 assert.equal(validDb.writes,0);

 const conflictDb=fakeDb({prior:{...committed,initial_order_id:'other_order_12345678'}});
 const conflictRequest=requestFor();
 const conflict=await onRequestPost({request:conflictRequest.request,env:{...env,DB:conflictDb.db}});
 assert.equal(conflict.status,403,'conflicting ledger identity must remain rejected');
 assert.equal(conflictDb.batches,0);

 const wrongAmountDb=fakeDb();
 const wrongAmountRequest=requestFor({amount:'166.00'});
 const wrongAmount=await onRequestPost({request:wrongAmountRequest.request,env:{...env,DB:wrongAmountDb.db}});
 assert.equal(wrongAmount.status,403,'mismatched amount must not be acknowledged as a duplicate');
 assert.equal(wrongAmountDb.batches,0);

 const wrongTokenDb=fakeDb();
 const wrongTokenRequest=requestFor({token:'other_token_12345678'});
 const wrongToken=await onRequestPost({request:wrongTokenRequest.request,env:{...env,DB:wrongTokenDb.db}});
 assert.equal(wrongToken.status,403,'mismatched token must not be acknowledged as a duplicate');
 assert.equal(wrongTokenDb.batches,0);
}finally{globalThis.fetch=originalFetch;}
console.log('PASS: exact authenticated renewal duplicate is acknowledged once without writes; conflicts, amount and token mismatches fail closed');

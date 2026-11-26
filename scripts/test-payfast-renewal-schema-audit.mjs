import assert from 'node:assert/strict';
const {CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:account,STAGING_DATABASE_ID:stage,PRODUCTION_DATABASE_ID:prod}=process.env;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
assert(token&&/^[0-9a-f]{32}$/i.test(account||'')&&uuid.test(stage||'')&&uuid.test(prod||'')&&stage.toLowerCase()!==prod.toLowerCase(),'Isolation failed');
const url='https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'+stage;
async function call(suffix,body){const r=await fetch(url+suffix,{headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});assert(r.ok,'Staging HTTP '+r.status);const d=await r.json();assert(d.success);return d.result}
const meta=await call('');assert(meta.uuid.toLowerCase()===stage.toLowerCase()&&meta.name==='kindelora-payfast-d1-staging');
async function query(sql,params=[]){const r=await call('/query',{sql,params});assert(r[0]?.success);return r[0].results}
const required={plus_payfast_renewal_atomic_guard:['singleton','expected_changes'],plus_payfast_renewal_events:['provider_transaction_id','initial_order_id','subscription_id','paid_zar_minor','status','previous_period_end','new_period_end','verified_at'],plus_payfast_recurring_links:['initial_order_id','subscription_id','customer_id','plan_id','expected_zar_minor','provider_subscription_token'],plus_subscriptions:['id','customer_id','brand','status','current_period_end','updated_at'],plus_orders:['id','customer_id','brand','status','amount_minor','currency'],plus_payment_events:['id','provider_event_reference']};
for(const [table,cols] of Object.entries(required)){
 const rows=await query('PRAGMA table_info('+table+')');
 assert(cols.every(c=>rows.some(r=>r.name===c)),table+' missing columns');
 const ddl=(await query("SELECT sql FROM sqlite_master WHERE type='table' AND name=?",[table]))[0]?.sql;
 assert(typeof ddl==='string',table+' missing DDL');
 console.log(table+' DDL: '+ddl);
 if(table==='plus_payfast_renewal_atomic_guard'){
 const normalized=ddl.toLowerCase().replace(/[\s"'\x60\[\]]/g,'');
 assert(normalized.includes('check(expected_changes=1)'),'Missing exact change guard');
 assert(normalized.includes('check(singleton=1)'),'Missing singleton guard');
 assert(rows.some(r=>r.name==='singleton'&&r.pk===1),'Missing singleton primary key');
 assert(rows.some(r=>r.name==='expected_changes'&&r.notnull===1),'Missing NOT NULL guard');
 }
 if(table==='plus_payfast_renewal_events'){
 const pk=rows.filter(r=>r.pk>0);
 assert(pk.length===1&&pk[0].name==='provider_transaction_id','Provider reference must be sole primary key');
 }
}
console.log('PASS: staging renewal columns and required atomic guard constraints');

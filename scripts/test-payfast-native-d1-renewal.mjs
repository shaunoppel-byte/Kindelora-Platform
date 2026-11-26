import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {writeFile,unlink} from 'node:fs/promises';
import {getPlatformProxy} from 'wrangler';
import {prepareAtomicPayFastRenewal} from '../functions/_lib/payfast-live-renewal-atomic-design.js';
const {CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:account,STAGING_DATABASE_ID:stage,PRODUCTION_DATABASE_ID:prod}=process.env;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
assert(token&&/^[0-9a-f]{32}$/i.test(account||'')&&uuid.test(stage||'')&&uuid.test(prod||'')&&stage.toLowerCase()!==prod.toLowerCase(),'Isolation failed');
const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'+stage,{headers:{Authorization:'Bearer '+token}});
assert(response.ok,'Staging identity lookup failed');
const meta=await response.json();
assert(meta.success&&meta.result.uuid.toLowerCase()===stage.toLowerCase()&&meta.result.name==='kindelora-payfast-d1-staging','Staging identity mismatch');
const config='.p0qa-'+randomBytes(12).toString('hex')+'.json';
await writeFile(config,JSON.stringify({name:'kindelora-staging-qa',compatibility_date:'2026-01-01',account_id:account,d1_databases:[{binding:'DB',database_name:meta.result.name,database_id:stage,remote:true}]}),{flag:'wx'});
let proxy;
try{
 proxy=await getPlatformProxy({configPath:config,remoteBindings:true,persist:false});
 const db=proxy.env.DB;
 assert(db&&typeof db.batch==='function');
 for(const plan of ['monthly','annual']){
 const prefix='p0qa_'+randomBytes(12).toString('hex')+'_';
 const schemas={
 plus_orders:'id TEXT PRIMARY KEY,customer_id TEXT,status TEXT,amount_minor INTEGER,currency TEXT',
 plus_subscriptions:'id TEXT PRIMARY KEY,customer_id TEXT,brand TEXT,status TEXT,current_period_end TEXT,updated_at TEXT',
 plus_payfast_recurring_links:'initial_order_id TEXT,subscription_id TEXT,customer_id TEXT,plan_id TEXT,expected_zar_minor INTEGER,provider_subscription_token TEXT',
 plus_payfast_renewal_events:'provider_transaction_id TEXT PRIMARY KEY,initial_order_id TEXT,subscription_id TEXT,paid_zar_minor INTEGER,status TEXT,previous_period_end TEXT,new_period_end TEXT,verified_at TEXT',
 plus_payment_events:'provider_event_reference TEXT',
 plus_payfast_renewal_atomic_guard:'singleton INTEGER PRIMARY KEY CHECK(singleton=1),expected_changes INTEGER NOT NULL CHECK(expected_changes=1)'};
 const names=Object.keys(schemas);
 const rewrite=sql=>sql.replace(/\bplus_[a-z_]+\b/g,n=>{assert(names.includes(n),'Unexpected table');return prefix+n});
 const adapter={prepare:sql=>db.prepare(rewrite(sql))};
 const run=(sql,...args)=>adapter.prepare(sql).bind(...args).run();
 const first=(sql)=>adapter.prepare(sql).first();
 const created=[];
 try{
 for(const n of names){await run('CREATE TABLE '+n+' ('+schemas[n]+')');created.push(n)}
 const previousPeriodEnd='2026-12-01T00:00:00.000Z',paidAt='2026-11-30T00:00:00.000Z',amountMinor=plan==='monthly'?15909:159254;
 await run('INSERT INTO plus_orders VALUES (?,?,?,?,?)','order0001','customer01','paid',amountMinor,'ZAR');
 await run('INSERT INTO plus_subscriptions VALUES (?,?,?,?,?,NULL)','subscription01','customer01','KIN','active',previousPeriodEnd);
 await run('INSERT INTO plus_payfast_recurring_links VALUES (?,?,?,?,?,?)','order0001','subscription01','customer01',plan,amountMinor,'token0001');
 const compose=id=>prepareAtomicPayFastRenewal({db:adapter,paidAt,verifiedRenewal:{ready:true,execute:false,grantEntitlement:false,renewal:{orderId:'order0001',customerId:'customer01',subscriptionId:'subscription01',providerTransactionId:id,providerSubscriptionToken:'token0001',plan,amountMinor,previousPeriodEnd}}});
 const batch=async id=>{const p=compose(id);assert.equal(p.proposedStatements.length,6);const results=await db.batch(p.proposedStatements);assert(results.every(r=>r.success===true));return results};
 const expected=plan==='monthly'?'2027-01-01T00:00:00.000Z':'2027-12-01T00:00:00.000Z';
 await run("UPDATE plus_subscriptions SET brand='OTHER'");
 await assert.rejects(()=>batch('payment001'),/constraint/i);
 assert.equal((await first('SELECT count(*) n FROM plus_payfast_renewal_events')).n,0);
 assert.equal((await first('SELECT current_period_end FROM plus_subscriptions')).current_period_end,previousPeriodEnd);
 await run("UPDATE plus_subscriptions SET brand='KIN'");
 const outcomes=await Promise.allSettled([batch('payment001'),batch('payment002')]);
 assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);
 assert.match(String(outcomes.find(x=>x.status==='rejected').reason),/constraint/i);
 await assert.rejects(()=>batch(outcomes[0].status==='fulfilled'?'payment001':'payment002'),/constraint/i);
 assert.equal((await first('SELECT current_period_end FROM plus_subscriptions')).current_period_end,expected);
 assert.equal((await first('SELECT count(*) n FROM plus_payfast_renewal_events')).n,1);
 assert.equal((await first('SELECT count(*) n FROM plus_payfast_renewal_atomic_guard')).n,0);
 console.log('PASS native D1 batch: '+plan+' rollback, concurrent renewal, replay, period integrity');
 }finally{for(const n of created.reverse())await run('DROP TABLE '+n)}
 }
}finally{try{await proxy?.dispose()}finally{await unlink(config)}}

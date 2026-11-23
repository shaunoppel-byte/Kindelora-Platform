// Issue #806: isolated D1 batch test harness. Never import into production routes.
// Only a separately deployed, staging-bound Worker may call runStagingAtomicity.
import {prepareAtomicPayFastRenewal} from '../functions/_lib/payfast-live-renewal-atomic-design.js';
const sql=(db,s,...args)=>db.prepare(s).bind(...args);
// Worker global scope must not generate random values (Cloudflare error 10021).
const period='2026-12-22T10:00:00.000Z';
function renewal(ids){return {orderId:ids.order,customerId:ids.customer,subscriptionId:ids.subscription,providerTransactionId:ids.tx,providerSubscriptionToken:ids.token,plan:'monthly',amountMinor:16500,previousPeriodEnd:period};}
async function state(db,ids){
 const sub=await sql(db,'SELECT current_period_end FROM plus_subscriptions WHERE id=?',ids.subscription).first();
 const events=await sql(db,'SELECT COUNT(*) AS n FROM plus_payfast_renewal_events WHERE initial_order_id=?',ids.order).first();
 return {period:sub?.current_period_end,events:events?.n};
}
function check(value,message){if(!value)throw Error('STAGING_ASSERTION_FAILED: '+message);}
export async function runStagingAtomicity(db){
 check(db&&typeof db.batch==='function','D1 batch binding required');
 const id='stg806_'+crypto.randomUUID().replaceAll('-','');
 const ids={customer:id+'_customer',order:id+'_order',subscription:id+'_subscription',token:id+'_token',tx:id+'_transaction'};
 const cleanup=async()=>{
  // Fixture-scoped only; never delete or update unrelated customer records.
  await sql(db,'DELETE FROM plus_payfast_renewal_events WHERE initial_order_id=?',ids.order).run();
  await sql(db,'DELETE FROM plus_payfast_recurring_links WHERE initial_order_id=?',ids.order).run();
  await sql(db,'DELETE FROM plus_subscriptions WHERE id=?',ids.subscription).run();
  await sql(db,'DELETE FROM plus_orders WHERE id=?',ids.order).run();
  await sql(db,'DELETE FROM plus_customers WHERE id=?',ids.customer).run();
 };
 try{
  await sql(db,'INSERT INTO plus_customers(id,identity_subject) VALUES(?,?)',ids.customer,id+'_subject').run();
  await sql(db,"INSERT INTO plus_orders(id,customer_id,brand,amount_minor,currency,status) VALUES(?,?,'KIN',16500,'ZAR','paid')",ids.order,ids.customer).run();
  await sql(db,"INSERT INTO plus_subscriptions(id,customer_id,brand,status,current_period_end) VALUES(?,?,'KIN','active',?)",ids.subscription,ids.customer,period).run();
  await sql(db,"INSERT INTO plus_payfast_recurring_links(initial_order_id,subscription_id,customer_id,plan_id,expected_zar_minor,provider_subscription_token) VALUES(?,?,?,'monthly',16500,?)",ids.order,ids.subscription,ids.customer,ids.token).run();
  const plan=prepareAtomicPayFastRenewal({db,verifiedRenewal:{ready:true,execute:false,grantEntitlement:false,renewal:renewal(ids)},paidAt:period});
  check(plan?.ready===false&&plan?.execute===false&&plan?.statements?.length===0&&plan?.proposedStatements?.length===6,'composer must remain inert');
  const before=await state(db,ids);check(before.period===period&&before.events===0,'initial fixture');
  // Submit the same authenticated synthetic event concurrently to the real D1 binding.
  // Exactly one batch must commit, even when requests race.
  const outcomes=await Promise.allSettled([
   db.batch(plan.proposedStatements),db.batch(plan.proposedStatements)
  ]);
  const successes=outcomes.filter(x=>x.status==='fulfilled').length;
  const failures=outcomes.filter(x=>x.status==='rejected').length;
  check(successes===1&&failures===1,'concurrent duplicate: exactly one batch may commit');
  const committed=await state(db,ids);
  check(committed.period==='2027-01-22T10:00:00.000Z'&&committed.events===1,'concurrent renewal commits once');
  let replayRejected=false;
  try{await db.batch(plan.proposedStatements);}catch{replayRejected=true;}
  check(replayRejected,'duplicate transaction must fail');
  check(JSON.stringify(await state(db,ids))===JSON.stringify(committed),'replay must not change state');
  // Negative-path atomic rollback: a mismatched provider token must not
  // insert a renewal event or extend the paid period.
  const negativeTx=id+'_wrong_token_transaction';
  const invalid={...renewal(ids),providerTransactionId:negativeTx,
   providerSubscriptionToken:id+'_incorrect_token',previousPeriodEnd:committed.period};
  const invalidPlan=prepareAtomicPayFastRenewal({db,verifiedRenewal:{
   ready:true,execute:false,grantEntitlement:false,renewal:invalid
  },paidAt:committed.period});
  check(invalidPlan?.proposedStatements?.length===6,'negative composer');
  const negativeBefore=await state(db,ids);
  let mismatchRejected=false;
  try{await db.batch(invalidPlan.proposedStatements);}catch{mismatchRejected=true;}
  check(mismatchRejected,'wrong recurring token must roll back');
  check(JSON.stringify(await state(db,ids))===JSON.stringify(negativeBefore),
   'wrong recurring token must not change entitlement or ledger');
  // Additional independently isolated rejection cases. Restore every mutation
  // before moving to the next case; never touch records outside this fixture.
  const negativeCases=[
   {name:'original order pending',set:"UPDATE plus_orders SET status='pending' WHERE id=?",restore:"UPDATE plus_orders SET status='paid' WHERE id=?",target:ids.order},
   {name:'subscription cancelled',set:"UPDATE plus_subscriptions SET status='cancelled' WHERE id=?",restore:"UPDATE plus_subscriptions SET status='active' WHERE id=?",target:ids.subscription},
   {name:'wrong settlement amount',set:"UPDATE plus_payfast_recurring_links SET expected_zar_minor=16501 WHERE initial_order_id=?",restore:"UPDATE plus_payfast_recurring_links SET expected_zar_minor=16500 WHERE initial_order_id=?",target:ids.order},
   {name:'changed previous period',set:"UPDATE plus_subscriptions SET current_period_end='2027-01-23T10:00:00.000Z' WHERE id=?",restore:"UPDATE plus_subscriptions SET current_period_end='2027-01-22T10:00:00.000Z' WHERE id=?",target:ids.subscription}
  ];
  for(const [i,scenario] of negativeCases.entries()){
   await sql(db,scenario.set,scenario.target).run();
   try{
    const beforeFailure=await state(db,ids);
    const candidate=prepareAtomicPayFastRenewal({db,verifiedRenewal:{
     ready:true,execute:false,grantEntitlement:false,
     renewal:{...renewal(ids),providerTransactionId:id+'_negative_'+i,
      previousPeriodEnd:committed.period}
    },paidAt:committed.period});
    check(candidate?.proposedStatements?.length===6,scenario.name+' composer');
    let rejected=false;
    try{await db.batch(candidate.proposedStatements);}catch{rejected=true;}
    check(rejected,scenario.name+' must reject');
    check(JSON.stringify(await state(db,ids))===JSON.stringify(beforeFailure),
     scenario.name+' must leave ledger and entitlement unchanged');
   }finally{await sql(db,scenario.restore,scenario.target).run();}
  }
  check(JSON.stringify(await state(db,ids))===JSON.stringify(committed),
   'all negative scenarios must restore original fixture state');
  return {status:'PASS',tests:['isolated fixture','concurrent duplicate: one commit one rejection','single atomic commit','replay rejected','replay no state change','wrong recurring token rollback','four additional D1 rollback cases'],fixturePrefix:'stg806_',productionCharging:false};
 }finally{await cleanup();}
}

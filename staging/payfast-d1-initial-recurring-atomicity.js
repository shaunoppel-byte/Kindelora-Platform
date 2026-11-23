// Issue #806 isolated staging D1 proof of the initial recurring-link batch.
// Synthetic fixture only. Never import from a production route.
import {livePlusActivationStatements} from '../functions/_lib/plus-live-activation-atomic-plan.js';
import {executeIsolatedInitialRecurringStaging} from '../functions/_lib/payfast-initial-recurring-isolated-staging-executor.js';
const sql=(db,s,...a)=>db.prepare(s).bind(...a);
const check=(v,m)=>{if(!v)throw Error('INITIAL_D1_ASSERTION_FAILED: '+m);};
export async function runInitialRecurringAtomicity(db){
 const id='stg806_initial_'+crypto.randomUUID().replaceAll('-','');
 const p={verified:true,environment:'live',paymentStatus:'COMPLETE',
  orderId:id+'_order',customerId:id+'_customer',subscriptionId:id+'_subscription',
  providerTransactionId:id+'_transaction',providerSubscriptionToken:id+'_token',
  plan:'monthly',amountMinor:16500};
 const at='2026-12-22T10:00:00.000Z';
 const cleanup=async()=>{
  await sql(db,'DELETE FROM plus_payment_reconciliations WHERE order_id=?',p.orderId).run();
  await sql(db,'DELETE FROM plus_payfast_recurring_links WHERE initial_order_id=?',p.orderId).run();
  await sql(db,'DELETE FROM plus_payment_events WHERE order_id=?',p.orderId).run();
  await sql(db,'DELETE FROM plus_subscriptions WHERE id=?',p.subscriptionId).run();
  await sql(db,'DELETE FROM plus_orders WHERE id=?',p.orderId).run();
  await sql(db,'DELETE FROM plus_customers WHERE id=?',p.customerId).run();
 };
 const state=async()=>({
  order:(await sql(db,'SELECT status FROM plus_orders WHERE id=?',p.orderId).first())?.status,
  subscriptions:(await sql(db,'SELECT COUNT(*) AS n FROM plus_subscriptions WHERE id=?',p.subscriptionId).first())?.n,
  events:(await sql(db,'SELECT COUNT(*) AS n FROM plus_payment_events WHERE order_id=?',p.orderId).first())?.n,
  links:(await sql(db,'SELECT COUNT(*) AS n FROM plus_payfast_recurring_links WHERE initial_order_id=?',p.orderId).first())?.n,
  reconciliations:(await sql(db,'SELECT COUNT(*) AS n FROM plus_payment_reconciliations WHERE order_id=?',p.orderId).first())?.n
 });
 try{
  await sql(db,'INSERT INTO plus_customers(id,identity_subject) VALUES(?,?)',p.customerId,id+'_subject').run();
  await sql(db,"INSERT INTO plus_orders(id,customer_id,brand,amount_minor,currency,status) VALUES(?,?,'KIN',16500,'ZAR','pending')",p.orderId,p.customerId).run();
  const plan=livePlusActivationStatements({db,verifiedPayment:p,paidAt:at});
  check(plan?.statements?.length===3,'initial activation plan');
  const preflight={ready:true,execute:false,grantEntitlement:false,requiresRollbackOnZeroChanges:true,
   verifiedPayment:p,existingSubscription:null,plan};
  const args={db,preflight,verifiedAt:at,stagingOnly:true};
  const before=await state();
  check(before.order==='pending'&&before.events===0&&before.links===0,'pending fixture');
  const gated=await executeIsolatedInitialRecurringStaging({...args,stagingOnly:false});
  check(gated.committed===false&&JSON.stringify(await state())===JSON.stringify(before),'staging gate leaves D1 unchanged');
  const success=await executeIsolatedInitialRecurringStaging(args);
  check(success.committed===true,'initial atomic batch commits');
  const after=await state();
  check(after.order==='paid'&&after.events===1&&after.subscriptions===1&&after.links===1&&after.reconciliations===1,'all five initial records committed');
  const replay=await executeIsolatedInitialRecurringStaging(args);
  check(replay.committed===false&&JSON.stringify(await state())===JSON.stringify(after),'initial replay rejected without mutation');
  return ['initial recurring staging gate no mutation','initial recurring five-statement atomic commit','initial recurring replay rollback'];
 }finally{await cleanup();}
}

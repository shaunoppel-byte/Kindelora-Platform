// Read-only server-side subscription state preflight for authenticated PayFast
// payment reconciliation. Never trusts a browser-supplied subscription ID.
// Does not charge, execute D1 writes, or grant PLUS access.
const deny=reason=>({ready:false,reason,grantEntitlement:false});
const validId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{8,128}$/.test(value);
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&
 Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
export async function loadLivePlusSubscriptionState({db,verifiedPayment}={}){
 if(!db||typeof db.prepare!=='function'||!verifiedPayment||
  verifiedPayment.verified!==true||verifiedPayment.environment!=='live'||
  verifiedPayment.paymentStatus!=='COMPLETE'||!validId(verifiedPayment.customerId)||
  !validId(verifiedPayment.orderId))return deny('invalid_verified_payment');
 try{
  const customer=await db.prepare('SELECT id FROM plus_customers WHERE id=? LIMIT 1')
   .bind(verifiedPayment.customerId).first();
  if(!customer||customer.id!==verifiedPayment.customerId)return deny('customer_not_found');
  const records=await db.prepare("SELECT id,customer_id,status,current_period_end FROM plus_subscriptions WHERE customer_id=? AND brand='KIN' LIMIT 2")
   .bind(verifiedPayment.customerId).all();
  if(!records||!Array.isArray(records.results)||records.results.length>1)return deny('ambiguous_subscription');
  if(records.results.length===0)return {ready:true,reason:'new_subscription',existingSubscription:null,grantEntitlement:false};
  const item=records.results[0];
  if(!validId(item.id)||item.customer_id!==verifiedPayment.customerId||
   !['active','past_due','cancelled','expired'].includes(item.status)||
   !validDate(item.current_period_end))return deny('invalid_subscription_state');
  return {ready:true,reason:'existing_subscription',grantEntitlement:false,
   existingSubscription:Object.freeze({id:item.id,customerId:item.customer_id,
    status:item.status,currentPeriodEnd:item.current_period_end})};
 }catch{return deny('db_failure')}
}

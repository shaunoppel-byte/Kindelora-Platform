// Server-only renewal transaction pipeline. No public route or charging toggle.
// Authenticates the raw PayFast ITN before reading persisted recurring identity.
// Uses the proposed six-statement batch only after readiness is verified.
// Cloudflare D1 staging proof is still outstanding.
import {authenticateLivePayFastItn} from './payfast-live-authenticated-itn.js';
import {verifyPersistedPayFastRenewalLink} from './payfast-live-renewal-link-preflight.js';
import {prepareAtomicPayFastRenewal} from './payfast-live-renewal-atomic-design.js';
const deny=reason=>({committed:false,reason,grantEntitlement:false});
const validId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{8,128}$/.test(v);
export async function processAuthenticatedLivePayFastRenewal({
 db,request,raw,merchantId,passphrase,allowedCidrs,fetchImpl,nowMs=Date.now()
}={}){
 if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function'||
  !Number.isSafeInteger(nowMs)||nowMs<0)return deny('invalid_renewal_configuration');
 try{
  const auth=await authenticateLivePayFastItn({request,raw,merchantId,passphrase,allowedCidrs,fetchImpl});
  if(!auth.authenticated)return deny('authentication_failed');
  const payment=auth.payment;
  if(!validId(payment.merchantReference)||!validId(payment.providerTransactionId)||
   !validId(payment.providerSubscriptionToken))return deny('verified_recurring_identity_required');
  // Never infer customer, plan or subscription identity from browser or ITN.
  const link=await db.prepare(
   'SELECT initial_order_id,subscription_id,customer_id,plan_id,expected_zar_minor,provider_subscription_token FROM plus_payfast_recurring_links WHERE initial_order_id=? LIMIT 1'
  ).bind(payment.merchantReference).first();
  if(!link||link.provider_subscription_token!==payment.providerSubscriptionToken)
   return deny('recurring_link_not_verified');
  const verified=await verifyPersistedPayFastRenewalLink({
   db,merchantReference:payment.merchantReference,
   providerTransactionId:payment.providerTransactionId,
   customerId:link.customer_id,subscriptionId:link.subscription_id,
   plan:link.plan_id,paidZarMinor:payment.amountMinor,
   providerSubscriptionToken:payment.providerSubscriptionToken,
   authenticatedPayment:payment
  });
  if(verified.duplicate===true&&verified.grantEntitlement===false&&verified.execute===false)
   return {committed:true,duplicate:true,reason:'authenticated_renewal_already_committed',grantEntitlement:false};
  if(!verified.ready)return deny('renewal_preflight_failed');
  const plan=prepareAtomicPayFastRenewal({db,verifiedRenewal:verified,paidAt:new Date(nowMs).toISOString()});
  if(!plan||plan.ready!==false||plan.reason!=='requires_staging_d1_atomicity_and_provider_identity_tests'||plan.execute!==false||plan.grantEntitlement!==false||
   plan.proposedStatements?.length!==6||plan.statements?.length!==0)
   return deny('renewal_atomic_plan_unavailable');
  // Native staging batch proof: PR #936; actual staging constraints: PR #937.
  // Recheck the bound database itself before executing any renewal.
  const guard=await db.prepare('PRAGMA table_info(plus_payfast_renewal_atomic_guard)').all();
  const events=await db.prepare('PRAGMA table_info(plus_payfast_renewal_events)').all();
  const ddl=await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='plus_payfast_renewal_atomic_guard'").first();
  const normalized=String(ddl?.sql||'').toLowerCase().replace(/[\s"'\x60\[\]]/g,'');
  if(!normalized.includes('check(expected_changes=1)')||!normalized.includes('check(singleton=1)')||
   !guard.results?.some(r=>r.name==='singleton'&&r.pk===1)||
   !guard.results?.some(r=>r.name==='expected_changes'&&r.notnull===1)||
   events.results?.filter(r=>r.pk>0).length!==1||
   !events.results?.some(r=>r.name==='provider_transaction_id'&&r.pk===1))
   return deny('renewal_atomic_plan_unavailable');
  const results=await db.batch(plan.proposedStatements);
  if(!Array.isArray(results)||results.length!==6||
   results.some((r,i)=>r?.success!==true||((i===0||i===3)&&r?.meta?.changes!==1)))
   return deny('transaction_not_committed');
  return {committed:true,reason:'authenticated_renewal_recorded',grantEntitlement:false};
 }catch{return deny('renewal_transaction_failed')}
}

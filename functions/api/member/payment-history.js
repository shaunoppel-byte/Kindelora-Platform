import {reply,ready,member} from './_auth.js';
// Read-only, member-scoped verified receipts. Never exposes provider tokens or other customers.
export async function onRequestGet({request,env}={}){
 if(!request||!ready(env))return reply({ok:false,reason:'unavailable'},503);
 try{
  const user=await member(request,env);
  if(!user)return reply({ok:false,reason:'authentication_required'},401);
  const result=await env.DB.prepare(`WITH receipts AS (
 SELECT r.payment_reference AS reference,r.amount_minor AS amount_minor,r.verified_at AS verified_at,q.plan_id AS plan,'initial' AS kind
 FROM plus_payment_reconciliations r JOIN plus_orders o ON o.id=r.order_id
 JOIN plus_customers c ON c.id=o.customer_id JOIN plus_order_quotes q ON q.order_id=o.id
 WHERE c.identity_subject=?1 AND o.brand='KIN' AND o.status='paid' AND o.currency='ZAR' AND r.currency='ZAR'
 AND r.amount_minor=o.amount_minor AND r.payment_reference=o.payment_reference
 AND r.verification_method='payfast_itn_and_server_validation'
 AND EXISTS(SELECT 1 FROM plus_payment_events e WHERE e.order_id=o.id AND e.provider='PayFast' AND e.provider_event_reference=r.payment_reference AND e.event_type='COMPLETE')
 UNION ALL
 SELECT e.provider_transaction_id,e.paid_zar_minor,e.verified_at,l.plan_id,'renewal'
 FROM plus_payfast_renewal_events e JOIN plus_payfast_recurring_links l ON l.initial_order_id=e.initial_order_id AND l.subscription_id=e.subscription_id
 JOIN plus_orders o ON o.id=l.initial_order_id JOIN plus_customers c ON c.id=o.customer_id
 WHERE c.identity_subject=?1 AND e.status='committed' AND o.brand='KIN' AND o.status='paid' AND o.currency='ZAR' AND e.paid_zar_minor=l.expected_zar_minor
 ) SELECT reference,amount_minor,verified_at,plan,kind FROM receipts ORDER BY verified_at DESC,reference LIMIT 101`).bind(user.id).all();
  if(result.success!==true||!Array.isArray(result.results))throw Error('query');
  const seen=new Set();
  for(const x of result.results){if(typeof x.reference!=='string'||!x.reference||seen.has(x.reference)||!Number.isSafeInteger(x.amount_minor)||x.amount_minor<=0||!['monthly','annual'].includes(x.plan)||!Number.isFinite(Date.parse(x.verified_at)))throw Error('integrity');seen.add(x.reference);}
  return reply({ok:true,currency:'ZAR',receipts:result.results.slice(0,100),hasMore:result.results.length>100});
 }catch{return reply({ok:false,reason:'payment_history_unavailable'},503);}
}

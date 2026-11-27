// Internal read-only KINDELORA finance source. No public route, no writes.
// Gross verified receipts only: provider fees and bank settlements are unknown.
export async function readVerifiedReceipts(db,{from,to}){
 if(!db||typeof db.prepare!=='function'||!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>=to||[from,to].some(d=>!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d))throw new TypeError('Invalid reporting range');
 const result=await db.prepare(`WITH receipts AS (
 SELECT r.payment_reference AS reference,r.amount_minor AS amount_minor,r.verified_at AS verified_at,q.plan_id AS plan,'initial' AS kind
 FROM plus_payment_reconciliations r JOIN plus_orders o ON o.id=r.order_id
 JOIN plus_order_quotes q ON q.order_id=o.id
 WHERE o.brand='KIN' AND o.status='paid' AND o.currency='ZAR' AND r.currency='ZAR'
 AND r.amount_minor=o.amount_minor AND r.payment_reference=o.payment_reference
 AND r.verification_method='payfast_itn_and_server_validation'
 AND EXISTS(SELECT 1 FROM plus_payment_events e WHERE e.order_id=o.id AND e.provider='PayFast' AND e.provider_event_reference=r.payment_reference AND e.event_type='COMPLETE')
 UNION ALL
 SELECT e.provider_transaction_id,e.paid_zar_minor,e.verified_at,l.plan_id,'renewal'
 FROM plus_payfast_renewal_events e JOIN plus_payfast_recurring_links l ON l.initial_order_id=e.initial_order_id AND l.subscription_id=e.subscription_id
 JOIN plus_orders o ON o.id=l.initial_order_id
 WHERE e.status='committed' AND o.brand='KIN' AND o.status='paid' AND o.currency='ZAR' AND e.paid_zar_minor=l.expected_zar_minor
 ) SELECT reference,amount_minor,verified_at,plan,kind FROM receipts WHERE verified_at>=? AND verified_at<? ORDER BY verified_at,reference LIMIT 10001`).bind(from+'T00:00:00.000Z',to+'T00:00:00.000Z').all();
 if(result.success!==true||!Array.isArray(result.results)||result.results.length>10000)throw new Error('Receipt query unavailable or range too large');
 const seen=new Set();let gross=0;const plans={monthly:{count:0,gross_minor:0},annual:{count:0,gross_minor:0}};
 for(const row of result.results){if(typeof row.reference!=='string'||!row.reference||seen.has(row.reference)||!Object.hasOwn(plans,row.plan)||!Number.isSafeInteger(row.amount_minor)||row.amount_minor<=0)throw new Error('Receipt integrity failure');seen.add(row.reference);gross+=row.amount_minor;plans[row.plan].count++;plans[row.plan].gross_minor+=row.amount_minor;if(!Number.isSafeInteger(gross))throw new Error('Receipt total overflow');}
 return {brand:'KIN',currency:'ZAR',from,to,gross_minor:gross,receipt_count:seen.size,plans,fees_minor:null,net_settlement_minor:null,bank_reconciled:null};
}

// D1 transaction boundary: create an accepted quote and pending order together.
// Caller MUST authenticate member and obtain a trusted approved ZAR quote first.
// This module never calls PayFast or grants PLUS access.
import {quotePlusZar} from './plus-pricing.mjs';
export async function createPendingPlusOrder(db, input) {
  if (!db || typeof db.batch !== 'function' || !input || !/^[a-f0-9-]{36}$/i.test(input.orderId||'') ||
      !/^[a-f0-9-]{36}$/i.test(input.customerId||'') ||
      typeof input.identitySubject !== 'string' || !input.identitySubject ||
      typeof input.fxSource !== 'string' || !input.fxSource ||
      typeof input.fxReference !== 'string' || !input.fxReference) throw new TypeError('invalid_order_input');
  const quote=quotePlusZar(input.planId,input.quote);
  const now=new Date().toISOString();
  const expiry=new Date(quote.quoteExpiresAtMs).toISOString();
  const statements=[
    db.prepare('INSERT INTO plus_customers(id,identity_subject) VALUES(?,?) ON CONFLICT(identity_subject) DO NOTHING').bind(input.customerId,input.identitySubject),
    db.prepare("INSERT INTO plus_orders(id,customer_id,brand,amount_minor,currency,status) VALUES(?,(SELECT id FROM plus_customers WHERE identity_subject=?),'KIN',?,'ZAR','pending')").bind(input.orderId,input.identitySubject,quote.settlementZarMinor),
    db.prepare('INSERT INTO plus_order_quotes(order_id,plan_id,display_usd_minor,settlement_zar_minor,fx_source,fx_rate_reference,quoted_at,expires_at,accepted_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(input.orderId,input.planId,quote.displayUsdMinor,quote.settlementZarMinor,input.fxSource,input.fxReference,now,expiry,now)
  ];
  const result=await db.batch(statements);
  if (!Array.isArray(result)||result.length!==statements.length||result.some(x=>x?.success!==true)) throw new Error('order_not_persisted');
  return Object.freeze({orderId:input.orderId,planId:input.planId,settlementZarMinor:quote.settlementZarMinor,expiresAt:expiry,status:'pending'});
}

// Read-only production D1 schema readiness gate. Never runs migrations or writes.
// Prevents live ITN processing if PLUS ledger/quote/reconciliation tables are missing.
const required={
 plus_customers:['id','identity_subject'],
 plus_orders:['id','customer_id','brand','amount_minor','currency','status','payment_reference'],
 plus_order_quotes:['order_id','plan_id','display_usd_minor','settlement_zar_minor','expires_at'],
 plus_payment_events:['id','order_id','provider','provider_event_reference','event_type'],
 plus_subscriptions:['id','customer_id','brand','status','current_period_end'],
 plus_payment_reconciliations:['order_id','payment_reference','verification_method','amount_minor','currency']
};
export async function verifyLivePlusD1Schema({db}={}){
 if(!db||typeof db.prepare!=='function')return {ready:false,reason:'db_unavailable'};
 try{
  for(const [table,columns] of Object.entries(required)){
   // Identifiers are constants in this module; never interpolate user input.
   const result=await db.prepare('PRAGMA table_info('+table+')').all();
   if(!Array.isArray(result?.results)||!columns.every(col=>result.results.some(row=>row.name===col)))
    return {ready:false,reason:'schema_unavailable'};
  }
  return {ready:true,reason:'required_plus_schema_present'};
 }catch{return {ready:false,reason:'schema_unavailable'}}
}

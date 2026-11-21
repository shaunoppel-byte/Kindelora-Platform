// Read-only D1 schema readiness probe. Never applies migrations or authorizes payments.
// Run server-side only; do not expose database identifiers or SQL errors to clients.
const REQUIRED={
 members:['id','email_verified_at','disabled_at'],
 member_sessions:['token_hash','member_id','expires_at'],
 payfast_sandbox_orders:['order_reference','member_id','plan','usd_minor','zar_minor','fx_reference','status','paid_at'],
 payfast_sandbox_transactions:['provider_transaction_id','order_reference','paid_zar_minor','status'],
 plus_customers:['id','identity_subject'],
 plus_subscriptions:['id','customer_id','brand','status','current_period_end']
};
export async function inspectPaymentSchema(db){
 if(!db||typeof db.prepare!=='function')return {ready:false,missing:['database_unavailable']};
 const missing=[];
 for(const [table,columns] of Object.entries(REQUIRED)){
  try{
   // Table names are hardcoded trusted constants; no request data enters SQL.
   const result=await db.prepare('PRAGMA table_info('+table+')').all();
   const found=new Set((result?.results||[]).map(r=>r.name));
   if(!found.size){missing.push(table);continue}
   for(const column of columns)if(!found.has(column))missing.push(table+'.'+column);
  }catch{missing.push(table)}
 }
 return {ready:missing.length===0,missing};
}

// Authenticated, read-only sandbox checkout status for the member's own order.
// Never trusts browser member IDs, never exposes transaction IDs or grants PLUS.
import {reply,ready,member} from '../member/_auth.js';
const deny=(status,reason)=>reply({ok:false,reason,plusActive:false},status);
export async function onRequestGet({request,env}={}){
 if(!request||!ready(env))return deny(503,'member_service_unavailable');
 let user;try{user=await member(request,env)}catch{return deny(503,'member_service_unavailable')}
 if(!user)return deny(401,'authentication_required');
 const reference=new URL(request.url).searchParams.get('reference');
 if(!/^[A-Za-z0-9_-]{8,128}$/.test(reference||''))return deny(400,'invalid_reference');
 try{
  const row=await env.DB.prepare("SELECT status,plan,created_at,paid_at FROM payfast_sandbox_orders WHERE order_reference=? AND member_id=? LIMIT 1").bind(reference,user.id).first();
  if(!row)return deny(404,'order_not_found');
  if(!['pending','paid','failed','cancelled'].includes(row.status)||!['monthly','annual'].includes(row.plan))return deny(503,'order_unavailable');
  return reply({ok:true,environment:'sandbox',status:row.status,plan:row.plan,plusActive:false});
 }catch{return deny(503,'database_unavailable')}
}

import {reply,ready,member} from './_auth.js';
import {readVerifiedReceipts} from '../../_lib/finance-verified-receipts.js';
// Explicit owner identity, not ordinary membership or Plus entitlement.
export async function onRequestGet({request,env}){
 try{
 if(!ready(env)||typeof env.FINANCE_OWNER_MEMBER_ID!=='string'||!env.FINANCE_OWNER_MEMBER_ID.trim())return reply({ok:false,error:'finance_unavailable'},503);
 const user=await member(request,env);
 if(!user)return reply({ok:false,error:'authentication_required'},401);
 if(user.id!==env.FINANCE_OWNER_MEMBER_ID)return reply({ok:false,error:'forbidden'},403);
 const url=new URL(request.url),from=url.searchParams.get('from'),to=url.searchParams.get('to');
 if(!from||!to||!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||from>=to||[from,to].some(d=>!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)||Date.parse(to)-Date.parse(from)>366*86400000)return reply({ok:false,error:'invalid_range'},400);
 const receipts=await readVerifiedReceipts(env.DB,{from,to});
 return reply({ok:true,source:'verified_payfast_receipts',asOf:new Date().toISOString(),receipts});
 }catch{return reply({ok:false,error:'finance_unavailable'},503);}
}

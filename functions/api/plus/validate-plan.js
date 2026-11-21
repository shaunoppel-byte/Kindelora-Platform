// Isolated authenticated plan validation; never starts a payment.
// The existing /api/plus/checkout release guard must remain unchanged.
import {reply,ready,member,originOK} from "../member/_auth.js";
import {resolvePlusPlan} from "../../_lib/plus-plan-contract.js";
export async function onRequestPost({request,env}){
 if(!ready(env))return reply({error:"member_service_unavailable"},503);
 if(!originOK(request))return reply({error:"invalid_origin"},403);
 let user;
 try{user=await member(request,env)}catch{return reply({error:"member_service_unavailable"},503)}
 if(!user)return reply({error:"authentication_required"},401);
 if((request.headers.get("content-type")||"").split(";")[0].trim().toLowerCase()!=="application/json")
  return reply({error:"invalid_content_type"},415);
 let raw;
 try{raw=await request.text()}catch{return reply({error:"invalid_request"},400)}
 if(raw.length>512)return reply({error:"request_too_large"},413);
 let payload;
 try{payload=JSON.parse(raw)}catch{return reply({error:"invalid_request"},400)}
 const plan=resolvePlusPlan(payload);
 if(!plan.ok)return reply({error:plan.reason},400);
 return reply({valid:true,plan:plan.plan,currency:plan.currency,amountMinor:plan.usdMinor,checkoutReady:false},200);
}

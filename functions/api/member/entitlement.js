import {reply,ready,member} from "./_auth.js";
export async function onRequestGet({request,env}){
 if(!ready(env))return reply({error:"Member access unavailable"},503);
 const user=await member(request,env);
 if(!user)return reply({authenticated:false,plus:false},401);
 // Paid status must be verified from server-side subscription state, never from a browser cookie.
 const row=await env.DB.prepare("SELECT id FROM subscriptions WHERE customer_id=? AND status='active' AND current_period_end>? LIMIT 1").bind(user.id,new Date().toISOString()).first();
 return reply({authenticated:true,plus:!!row});
}

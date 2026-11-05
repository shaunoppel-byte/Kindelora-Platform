import {reply,ready,member} from "./_auth.js";
export async function onRequestGet({request,env}){
 if(!ready(env))return reply({error:"Member access unavailable"},503);
 const user=await member(request,env);
 if(!user)return reply({authenticated:false,plus:false},401);
 // Paid status must be verified from server-side subscription state, never from a browser cookie.
 const row=await env.DB.prepare("SELECT s.id FROM subscriptions s JOIN customers c ON c.id=s.customer_id WHERE c.email_normalized=? AND c.email_verified_at IS NOT NULL AND s.status='active' AND s.current_period_end>? LIMIT 1").bind(user.email_normalized,new Date().toISOString()).first();
 return reply({authenticated:true,plus:!!row});
}

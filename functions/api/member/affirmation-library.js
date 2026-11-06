import {reply,ready,member} from "./_auth.js";
export async function onRequestGet({request,env}){
 if(!ready(env))return reply({error:"Member access unavailable"},503);
 const user=await member(request,env);
 if(!user)return reply({error:"Sign in required"},401);
 const row=await env.DB.prepare("SELECT s.id FROM subscriptions s JOIN customers c ON c.id=s.customer_id WHERE c.email_normalized=? AND c.email_verified_at IS NOT NULL AND s.status='active' AND s.current_period_end>? LIMIT 1").bind(user.email_normalized,new Date().toISOString()).first();
 if(!row)return reply({error:"Active Plus subscription required"},403);
 const available=!!env.PRIVATE_AFFIRMATION_ARTWORK;
 return reply({items:[],premiumArtworkReady:available});
}

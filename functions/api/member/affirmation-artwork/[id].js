import {ready,member} from "../_auth.js";
const allowed=new Set(["one-breath","worthy-now","begin-again","small-steps","rest-is-worthy","light-returns"]);
export async function onRequestGet({request,env,params}){
 const deny=(status)=>new Response(null,{status,headers:{"cache-control":"private, no-store","x-content-type-options":"nosniff"}});
 if(!ready(env))return deny(503);
 const user=await member(request,env);
 if(!user)return deny(401);
 const row=await env.DB.prepare("SELECT s.id FROM subscriptions s JOIN customers c ON c.id=s.customer_id WHERE c.email_normalized=? AND c.email_verified_at IS NOT NULL AND s.status='active' AND s.current_period_end>? LIMIT 1").bind(user.email_normalized,new Date().toISOString()).first();
 if(!row)return deny(403);
 const id=params?.id;
 if(typeof id!=="string"||!allowed.has(id))return deny(404);
 if(!env.PRIVATE_AFFIRMATION_ARTWORK)return deny(503);
 const object=await env.PRIVATE_AFFIRMATION_ARTWORK.get("published/"+id+".png");
 if(!object)return deny(404);
 return new Response(object.body,{status:200,headers:{"content-type":"image/png","cache-control":"private, no-store","x-content-type-options":"nosniff","content-disposition":"inline; filename=\""+id+".png\""}});
}

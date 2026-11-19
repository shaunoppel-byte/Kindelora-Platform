import {verifyPlusEntitlement} from "../../../_lib/plus-entitlement.js";
import {ready,member} from "../_auth.js";
const allowed=new Set(["one-breath","worthy-now","begin-again","small-steps","rest-is-worthy","light-returns"]);
export async function onRequestGet({request,env,params}){
 const deny=(status)=>new Response(null,{status,headers:{"cache-control":"private, no-store","x-content-type-options":"nosniff"}});
 if(!ready(env))return deny(503);
 const user=await member(request,env);
 if(!user)return deny(401);
 const access=await verifyPlusEntitlement({db:env.DB,verifiedIdentitySubject:user.id});
 if(access.reason==="unavailable")return deny(503);
 if(!access.entitled)return deny(403);
 const id=params?.id;
 if(typeof id!=="string"||!allowed.has(id))return deny(404);
 if(!env.PRIVATE_AFFIRMATION_ARTWORK)return deny(503);
 const object=await env.PRIVATE_AFFIRMATION_ARTWORK.get("published/"+id+".png");
 if(!object)return deny(404);
 return new Response(object.body,{status:200,headers:{"content-type":"image/png","cache-control":"private, no-store","x-content-type-options":"nosniff","content-disposition":"inline; filename=\""+id+".png\""}});
}

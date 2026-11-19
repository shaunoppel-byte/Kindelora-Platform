import {verifyPlusEntitlement} from "../../_lib/plus-entitlement.js";
import {reply,ready,member} from "./_auth.js";
export async function onRequestGet({request,env}){
 if(!ready(env))return reply({error:"Member access unavailable"},503);
 const user=await member(request,env);
 if(!user)return reply({error:"Sign in required"},401);
 const access=await verifyPlusEntitlement({db:env.DB,verifiedIdentitySubject:user.id});
 if(access.reason==="unavailable")return reply({error:"Membership verification unavailable"},503);
 if(!access.entitled)return reply({error:"Active Plus subscription required"},403);
 if(!env.PRIVATE_AFFIRMATION_ARTWORK)return reply({error:"Private artwork storage unavailable",items:[],premiumArtworkReady:false},503);
 const artwork=[
  {id:"one-breath",title:"One breath at a time",affirmation:"I do not have to carry the whole day at once. One breath. One step. That is enough for now."},
  {id:"worthy-now",title:"Worthy, just as I am",affirmation:"I am worthy of kindness even on the days I feel unfinished. I do not have to earn it."},
  {id:"begin-again",title:"Tomorrow holds possibility",affirmation:"A hard day is not the whole story. There is still room for something beautiful."},
  {id:"small-steps",title:"Small steps still count",affirmation:"Every small step I take matters. I can move forward gently, without rushing my own journey."},
  {id:"rest-is-worthy",title:"Rest is part of growing",affirmation:"I am allowed to rest without guilt. Quiet moments help me return with strength and clarity."},
  {id:"light-returns",title:"The light returns",affirmation:"Even when today feels heavy, I can trust that brighter moments are still possible."}
 ];
 const checks=await Promise.all(artwork.map(item=>env.PRIVATE_AFFIRMATION_ARTWORK.head("published/"+item.id+".png")));
 if(checks.some(result=>!result))return reply({error:"Private artwork collection is incomplete",items:[],premiumArtworkReady:false},503);
 return reply({items:artwork.map(item=>({...item,image:"/api/member/affirmation-artwork/"+item.id})),premiumArtworkReady:true});
}

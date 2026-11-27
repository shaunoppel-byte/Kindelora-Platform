import {reply,ready,member} from "./_auth.js";
import {verifyPlusEntitlement} from "../../_lib/plus-entitlement.js";

// A login proves identity, not payment. Bind PLUS to the authenticated member ID,
// never an email string supplied by the browser or an unrelated finance table.
export async function onRequestGet({request,env}){
 if(!ready(env))return reply({error:"Member access unavailable"},503);
 try{
  const user=await member(request,env);
  if(!user)return reply({authenticated:false,plus:false},401);
  const verified=await verifyPlusEntitlement({
   db:env.DB,
   verifiedIdentitySubject:user.id
  });
  if(verified.reason==="unavailable")return reply({error:"Membership verification unavailable"},503);
  return reply({authenticated:true,plus:verified.entitled,memberId:user.id});
 }catch{
  return reply({error:"Member access unavailable"},503);
 }
}

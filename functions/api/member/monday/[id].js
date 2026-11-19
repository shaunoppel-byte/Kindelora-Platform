import {verifyPlusEntitlement} from "../../../_lib/plus-entitlement.js";
import {ready,member} from "../_auth.js";

// Premium editions must be stored in PRIVATE_MONDAY_MEDIA, not public Pages assets.
// Object keys: editions/mm-YYYY-MM-DD.json and editions/mm-YYYY-MM-DD.mp3.
const deny=(status)=>new Response(null,{status,headers:{"cache-control":"private, no-store","x-content-type-options":"nosniff"}});
export async function onRequestGet({request,env,params}){
 if(!ready(env))return deny(503);
 try{
  const user=await member(request,env);
  if(!user)return deny(401);
  const access=await verifyPlusEntitlement({db:env.DB,verifiedIdentitySubject:user.id});
  if(access.reason==="unavailable")return deny(503);
  if(!access.entitled)return deny(403);
  const id=params?.id;
  if(typeof id!=="string"||!/^mm-20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(id))return deny(404);
  const type=new URL(request.url).searchParams.get("format")==="audio"?"audio":"text";
  if(!env.PRIVATE_MONDAY_MEDIA)return deny(503);
  const object=await env.PRIVATE_MONDAY_MEDIA.get("editions/"+id+(type==="audio"?".mp3":".json"));
  if(!object)return deny(404);
  return new Response(object.body,{status:200,headers:{"content-type":type==="audio"?"audio/mpeg":"application/json; charset=utf-8","cache-control":"private, no-store","x-content-type-options":"nosniff","content-disposition":"inline"}});
 }catch(_error){return deny(503)}
}

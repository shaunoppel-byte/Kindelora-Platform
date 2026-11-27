import {reply,ready,member,originOK} from "./_auth.js";
import {verifyPlusEntitlement} from "../../_lib/plus-entitlement.js";
export async function onRequest({request,env}){
 if(env.MEMBER_FAVOURITES_ENABLED!=="true")return reply({error:"Favourites unavailable",code:"feature_disabled"},503);
 if(!ready(env))return reply({error:"Favourites unavailable"},503);
 if(!["GET","POST","DELETE"].includes(request.method))return reply({error:"Method not allowed"},405);
 if(request.method!=="GET"&&!originOK(request))return reply({error:"Forbidden"},403);
 try{
  const user=await member(request,env);
  if(!user)return reply({error:"Sign in required"},401);
  const access=await verifyPlusEntitlement({db:env.DB,verifiedIdentitySubject:user.id});
  if(access.reason==="unavailable")return reply({error:"Membership unavailable"},503);
  if(!access.entitled)return reply({error:"PLUS required"},403);
  if(request.method==="GET"){
   const rows=await env.DB.prepare("SELECT kind,content,created_at FROM member_favourites WHERE member_id=? ORDER BY created_at DESC LIMIT 100").bind(user.id).all();
   return reply({memberId:user.id,items:rows.results});
  }
  if(!request.headers.get("content-type")?.startsWith("application/json"))return reply({error:"JSON required"},415);
  const raw=await request.text();
  if(new TextEncoder().encode(raw).length>18000)return reply({error:"Payload too large"},413);
  let body;try{body=JSON.parse(raw)}catch{return reply({error:"Invalid JSON"},400)}
  if(!body||!["messages","affirmations"].includes(body.kind)||typeof body.content!=="string"||!body.content.trim()||body.content.length>4000)return reply({error:"Invalid favourite"},400);
  if(body.expectedMemberId!==user.id)return reply({error:"Account changed"},409);
  const content=body.content.trim();
  if(request.method==="DELETE"){
   await env.DB.prepare("DELETE FROM member_favourites WHERE member_id=? AND kind=? AND content=?").bind(user.id,body.kind,content).run();
   return reply({ok:true});
  }
  await env.DB.prepare("INSERT OR IGNORE INTO member_favourites(member_id,kind,content,created_at) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM member_favourites WHERE member_id=?)<100").bind(user.id,body.kind,content,new Date().toISOString(),user.id).run();
  const saved=await env.DB.prepare("SELECT 1 AS saved FROM member_favourites WHERE member_id=? AND kind=? AND content=?").bind(user.id,body.kind,content).first();
  return saved?reply({ok:true}):reply({error:"Library full"},409);
 }catch{return reply({error:"Favourites unavailable"},503)}
}

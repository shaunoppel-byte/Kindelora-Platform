import {reply,ready,member} from '../../member/_auth.js';
import {verifyPlusEntitlement} from '../../../_lib/plus-entitlement.js';
export async function onRequestGet({request,env}={}){
 if(env?.PLUS_PROTECTED_CONTENT_ENABLED!=='true'||!ready(env))return reply({error:'unavailable'},503);
 let user;
 try{user=await member(request,env)}catch{return reply({error:'unavailable'},503)}
 if(!user)return reply({error:'authentication_required'},401);
 const result=await verifyPlusEntitlement({db:env.DB,verifiedIdentitySubject:user.id});
 if(result.reason==='unavailable')return reply({error:'unavailable'},503);
 if(!result.entitled)return reply({error:'plus_required'},403);
 try{
  const url=new URL('/content/motivational-monday-2026-11-16-approved.json',request.url);
  const asset=await env.ASSETS.fetch(new Request(url,{method:'GET'}));
  if(!asset.ok||!/^application\/json(?:;|$)/i.test(asset.headers.get('content-type')||''))return reply({error:'unavailable'},503);
  const payload=await asset.json();
  if(payload?.release_decision!=='GO'||!Array.isArray(payload?.content?.paragraphs)||!payload.content.paragraphs.length||!payload.content.paragraphs.every(p=>typeof p==='string'))return reply({error:'edition_unavailable'},404);
  return reply({content:{paragraphs:payload.content.paragraphs}},200,{'cache-control':'no-store, private','vary':'Cookie'});
 }catch{return reply({error:'unavailable'},503)}
}

// Read-only authenticated PLUS subscription account status. No billing mutations.
import {reply,ready,member} from '../member/_auth.js';
import {verifyPlusEntitlement} from '../../_lib/plus-entitlement.js';
export async function onRequestGet({request,env}={}){
 if(!request||!ready(env))return reply({active:false,reason:'member_service_unavailable'},503);
 let user;try{user=await member(request,env)}catch{return reply({active:false,reason:'member_service_unavailable'},503)}
 if(!user)return reply({active:false,reason:'authentication_required'},401);
 const result=await verifyPlusEntitlement({db:env.DB,verifiedIdentitySubject:user.id});
 if(result.reason==='unavailable')return reply({active:false,reason:'subscription_unavailable'},503);
 return reply({active:result.entitled,reason:result.reason},200);
}
export async function onRequestPost(){return reply({error:'subscription_changes_unavailable'},503)}

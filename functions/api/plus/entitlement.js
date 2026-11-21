// Read-only PLUS entitlement for a verified KINDELORA member session.
// Login does not confer PLUS. No client-provided identity is accepted.
import {reply,ready,member} from '../member/_auth.js';
import {verifyPlusEntitlement} from '../../_lib/plus-entitlement.js';
export async function onRequestGet({request,env}={}){
 if(!ready(env))return reply({entitled:false,reason:'member_service_unavailable'},503);
 let user;
 try{user=await member(request,env)}catch{return reply({entitled:false,reason:'member_service_unavailable'},503)}
 if(!user)return reply({entitled:false,reason:'authentication_required'},401);
 const result=await verifyPlusEntitlement({db:env.DB,verifiedIdentitySubject:user.id});
 if(result.reason==='unavailable')return reply({entitled:false,reason:'entitlement_unavailable'},503);
 return reply({entitled:result.entitled,reason:result.reason},200);
}

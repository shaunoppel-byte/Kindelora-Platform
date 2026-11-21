// Non-sensitive production preflight. Never return merchant identifiers or secrets.
// This is a read-only readiness check, NOT a payment initiation endpoint.
import {reply,ready,member} from "../member/_auth.js";
export async function onRequestGet({request,env}){
 if(!ready(env))return reply({ready:false,reason:"member_service_unavailable"},503);
 let user;
 try{user=await member(request,env)}catch{return reply({ready:false,reason:"member_service_unavailable"},503)}
 if(!user)return reply({ready:false,reason:"authentication_required"},401);
 // The current checkout handler is intentionally disabled. Never claim readiness
 // based solely on configured secrets or the existence of a PayFast account.
 return reply({ready:false,reason:"checkout_not_enabled",plans:{monthly:{currency:"USD",amountMinor:899},annual:{currency:"USD",amountMinor:8999}}},503);
}
